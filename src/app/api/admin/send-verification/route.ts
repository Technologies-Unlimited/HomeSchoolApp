import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { sendNotificationEmail } from "@/lib/notifications";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !isAdmin(admin.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID required." }, { status: 400 });
    }

    const db = await getDb();
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.emailVerified) {
      return NextResponse.json({ error: "User is already verified." }, { status: 400 });
    }

    // Generate a fresh token
    const token = randomBytes(32).toString("hex");
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verificationToken: token, verificationTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000) } }
    );

    const { getBaseUrl } = await import("@/lib/base-url");
    const verifyUrl = `${getBaseUrl()}/verify/${token}`;

    const { buildVerificationEmailHtml } = await import("@/lib/verification-email");
    await sendNotificationEmail({
      to: targetUser.email,
      subject: "Verify your email — Home School Group",
      html: buildVerificationEmailHtml({ firstName: targetUser.firstName ?? "there", verifyUrl }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
