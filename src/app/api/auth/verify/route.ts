import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ verificationToken: token, emailVerified: false });
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
  }

  if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
    return NextResponse.json({ error: "Verification link has expired. Please request a new one." }, { status: 400 });
  }

  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { emailVerified: true, verificationToken: null, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true, email: user.email });
}
