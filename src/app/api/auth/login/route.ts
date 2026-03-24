import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { signToken, setAuthCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  console.log("[LOGIN] POST /api/auth/login — request received");
  try {
    const body = await request.json();
    console.log("[LOGIN] Request body parsed:", { email: body.email });

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[LOGIN] Validation failed:", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.log("[LOGIN] Validation passed for:", parsed.data.email);

    const { password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const db = await getDb();
    console.log("[LOGIN] Database connection established");

    const user = await db.collection("users").findOne({ email });
    if (!user || !user.passwordHash) {
      console.warn("[LOGIN] User not found or missing passwordHash for:", email);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    console.log("[LOGIN] User found — id:", user._id.toString(), "role:", user.role ?? "user");

    const valid = await verifyPassword(password, user.passwordHash as string);
    if (!valid) {
      console.warn("[LOGIN] Password mismatch for:", email);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    console.log("[LOGIN] Password verified successfully");

    const token = signToken({ userId: user._id.toString(), role: user.role ?? "user" });
    console.log("[LOGIN] JWT signed for user:", user._id.toString());

    await setAuthCookie(token);
    console.log("[LOGIN] Auth cookie set");

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    console.log("[LOGIN] lastLogin updated in database");

    console.log("[LOGIN] Login complete — responding 200 for:", email);
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified ?? false,
        approved: user.approved ?? false,
        role: user.role ?? "user",
      },
    });
  } catch (error) {
    console.error("[LOGIN] Unhandled error:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
