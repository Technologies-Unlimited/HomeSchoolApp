import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { sendNotificationEmail } from "@/lib/notifications";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { phone, firstName, lastName, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    // Child info (required)
    const childFirstName = typeof body.childFirstName === "string" ? body.childFirstName.trim() : "";
    const childLastName = typeof body.childLastName === "string" ? body.childLastName.trim() : "";
    if (!childFirstName || !childLastName) {
      return NextResponse.json({ error: "Child's first and last name are required." }, { status: 400 });
    }

    // Optional spouse email for linking
    const spouseEmail = typeof body.spouseEmail === "string" ? body.spouseEmail.trim().toLowerCase() : "";

    const db = await getDb();

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();
    const now = new Date();

    const result = await db.collection("users").insertOne({
      email,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: "user",
      isActive: true,
      emailVerified: false,
      approved: false,
      verificationToken,
      verificationTokenExpiry: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId;

    // Create family with the child
    let linkedToExistingFamily = false;

    if (spouseEmail) {
      // Check if spouse exists and has a family
      const spouseUser = await db.collection("users").findOne({ email: spouseEmail });
      if (spouseUser) {
        const spouseFamily = await db.collection("families").findOne({
          $or: [{ userId: spouseUser._id }, { linkedUserIds: spouseUser._id }],
        });
        if (spouseFamily) {
          // Send a family link invite instead of creating a new family
          const fromName = `${firstName} ${lastName}`.trim();
          const toName = [spouseUser.firstName, spouseUser.lastName].filter(Boolean).join(" ") || spouseUser.email;
          await db.collection("familyInvites").insertOne({
            fromUserId: userId,
            fromUserName: fromName,
            fromUserEmail: email,
            toUserId: spouseUser._id,
            toUserName: toName,
            toUserEmail: spouseUser.email,
            status: "pending",
            childToAdd: { firstName: childFirstName, lastName: childLastName },
            createdAt: now,
          });
          linkedToExistingFamily = true;
        }
      }
    }

    if (!linkedToExistingFamily) {
      // Create a new family with the child
      await db.collection("families").insertOne({
        userId,
        emergencyContact: "",
        medicalNotes: "",
        children: [
          {
            _id: new ObjectId(),
            firstName: childFirstName,
            lastName: childLastName,
            dateOfBirth: "",
            createdAt: now,
            updatedAt: now,
          },
        ],
        linkedUserIds: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Send verification email
    const baseUrl = request.headers.get("origin") || request.headers.get("host") || "http://localhost:3000";
    const verifyUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/verify/${verificationToken}`;

    try {
      await sendNotificationEmail({
        to: email,
        subject: "Verify your email — Home School Group",
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Welcome to Home School Group!</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;">Hi ${firstName}, please verify your email address to get started.</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Verify my email</a>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">If you didn't create this account, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[REGISTER] Failed to send verification email:", emailError);
    }

    // Notify admins
    try {
      const admins = await db.collection("users").find({ role: { $in: ["admin", "super_admin"] } }, { projection: { email: 1 } }).toArray();
      for (const admin of admins) {
        await sendNotificationEmail({
          to: admin.email,
          subject: `New member signup — ${firstName} ${lastName}`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">New Member Signup</h2>
              <p style="margin:0 0 8px;color:#475569;font-size:14px;"><strong>${firstName} ${lastName}</strong> (${email}) has signed up.</p>
              <p style="margin:0 0 8px;color:#475569;font-size:14px;">Child: <strong>${childFirstName} ${childLastName}</strong></p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;">They need to verify their email first, then you can approve them from the admin dashboard.</p>
            </div>
          `,
        });
      }
    } catch (adminEmailError) {
      console.error("[REGISTER] Failed to notify admins:", adminEmailError);
    }

    // Sign in the user (limited access until verified + approved)
    const token = signToken({ userId: userId.toString(), role: "user" });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: userId.toString(),
        email,
        firstName,
        lastName,
        role: "user",
        emailVerified: false,
        approved: false,
      },
    });
  } catch (error) {
    console.error("[REGISTER] Unhandled error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
