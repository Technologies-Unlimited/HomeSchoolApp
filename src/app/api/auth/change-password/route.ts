import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || typeof currentPassword !== "string") {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const db = await getDb();
  const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user._id) });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const newHash = await hashPassword(newPassword);
  await db.collection("users").updateOne(
    { _id: new ObjectId(user._id) },
    { $set: { passwordHash: newHash, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
