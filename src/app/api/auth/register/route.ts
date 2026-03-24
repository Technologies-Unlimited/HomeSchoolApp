import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  console.log("[REGISTER] POST /api/auth/register — request received");
  try {
    const body = await request.json();
    console.log("[REGISTER] Request body parsed:", { email: body.email, firstName: body.firstName, lastName: body.lastName, phone: body.phone });

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[REGISTER] Validation failed:", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.log("[REGISTER] Validation passed");

    const { email, phone, firstName, lastName, password } = parsed.data;
    const db = await getDb();
    console.log("[REGISTER] Database connection established");

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      console.warn("[REGISTER] Duplicate email rejected:", email);
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    console.log("[REGISTER] Email is available:", email);

    const passwordHash = await hashPassword(password);
    console.log("[REGISTER] Password hashed successfully");

    const now = new Date();
    const result = await db.collection("users").insertOne({
      email,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: "user",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log("[REGISTER] User inserted into database — id:", result.insertedId.toString());

    const token = signToken({ userId: result.insertedId.toString(), role: "user" });
    console.log("[REGISTER] JWT signed for user:", result.insertedId.toString());

    await setAuthCookie(token);
    console.log("[REGISTER] Auth cookie set");

    console.log("[REGISTER] Registration complete — responding 200 for:", email);
    return NextResponse.json({
      user: {
        id: result.insertedId.toString(),
        email,
        phone,
        firstName,
        lastName,
        role: "user",
      },
    });
  } catch (error) {
    console.error("[REGISTER] Unhandled error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
