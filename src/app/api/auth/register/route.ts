import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { email, phone, firstName, lastName, password } = parsed.data;
    const db = await getDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
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

    const token = signToken({ userId: result.insertedId.toString(), role: "user" });
    setAuthCookie(token);

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
    console.error("Register error", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
