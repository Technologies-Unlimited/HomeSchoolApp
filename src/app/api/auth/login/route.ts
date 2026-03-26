import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { signToken, setAuthCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const db = await getDb();

    const user = await db.collection("users").findOne({ email });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signToken({ userId: user._id.toString(), role: user.role ?? "user" });
    await setAuthCookie(token);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

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
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
