import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { sendNotificationEmail } from "@/lib/notifications";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ _id: user._id });
    if (!userDoc) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (userDoc.emailVerified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    // Generate new token if needed
    let token = userDoc.verificationToken;
    if (!token) {
      token = randomBytes(32).toString("hex");
      await db.collection("users").updateOne({ _id: user._id }, { $set: { verificationToken: token, verificationTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000) } });
    }

    const { getBaseUrl } = await import("@/lib/base-url");
    const verifyUrl = `${getBaseUrl()}/verify/${token}`;

    const { buildVerificationEmailHtml } = await import("@/lib/verification-email");
    await sendNotificationEmail({
      to: userDoc.email,
      subject: "Verify your email — Home School Group",
      html: buildVerificationEmailHtml({ firstName: userDoc.firstName ?? "there", verifyUrl }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
