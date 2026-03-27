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

    // Check if this user was invited — inherit role and auto-approve
    const invite = await db.collection("invites").findOne({ email, status: "pending" });
    const assignedRole = invite?.role === "admin" ? "admin" : "user";
    const autoApproved = !!invite;

    const result = await db.collection("users").insertOne({
      email,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: assignedRole,
      isActive: true,
      emailVerified: false,
      approved: autoApproved,
      verificationToken,
      verificationTokenExpiry: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      ...(autoApproved ? { approvedAt: now, approvedBy: invite.invitedBy } : {}),
    });

    // Mark invite as accepted
    if (invite) {
      await db.collection("invites").updateOne(
        { _id: invite._id },
        { $set: { status: "accepted", acceptedAt: now } }
      );
    }

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
    const { getBaseUrl } = await import("@/lib/base-url");
    const verifyUrl = `${getBaseUrl()}/verify/${verificationToken}`;

    try {
      const { buildVerificationEmailHtml } = await import("@/lib/verification-email");
      await sendNotificationEmail({
        to: email,
        subject: "Verify your email — Home School Group",
        html: buildVerificationEmailHtml({ firstName, verifyUrl }),
      });
    } catch {
      // Email failed but account was created — user can resend from pending-approval page
    }

    // Notify admins
    try {
      const { brandedEmail, infoCard, ctaButton } = await import("@/lib/email-template");
      const admins = await db.collection("users").find({ role: { $in: ["admin", "super_admin"] } }, { projection: { email: 1 } }).toArray();
      const adminHtml = brandedEmail({
        icon: "&#128075;",
        headline: "New Member Signup",
        subtitle: `${firstName} ${lastName} wants to join`,
        body: `
          ${infoCard(`
            <p style="margin:0 0 6px;font-size:14px;color:#1e293b;font-weight:600;">${firstName} ${lastName}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#475569;">${email}</p>
            <p style="margin:0;font-size:13px;color:#475569;">Child: ${childFirstName} ${childLastName}</p>
          `)}
          <p style="margin:16px 0 0;font-size:14px;color:#475569;">They need to verify their email first, then you can approve them from the admin dashboard.</p>
          ${ctaButton(`${getBaseUrl()}/admin`, "Open Admin Dashboard")}
        `,
        footerText: "You received this because you are an admin of Home School Group.",
      });
      for (const admin of admins) {
        await sendNotificationEmail({ to: admin.email, subject: `New member signup — ${firstName} ${lastName}`, html: adminHtml });
      }
    } catch {
      // Admin notification failed — non-critical
    }

    // Sign in the user (limited access until verified + approved)
    const token = signToken({ userId: userId.toString(), role: assignedRole });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: userId.toString(),
        email,
        firstName,
        lastName,
        role: assignedRole,
        emailVerified: false,
        approved: autoApproved,
      },
    });
  } catch (error) {
    console.error("[REGISTER] Unhandled error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
