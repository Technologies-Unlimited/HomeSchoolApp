import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { sendNotificationEmail } from "@/lib/notifications";

export async function POST(request: Request) {
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
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    token = "";
    for (let i = 0; i < 48; i++) token += chars[Math.floor(Math.random() * chars.length)];
    await db.collection("users").updateOne({ _id: user._id }, { $set: { verificationToken: token } });
  }

  const baseUrl = request.headers.get("origin") || request.headers.get("host") || "http://localhost:3000";
  const verifyUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/verify/${token}`;

  await sendNotificationEmail({
    to: userDoc.email,
    subject: "Verify your email — Home School Group",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Verify your email</h2>
        <p style="margin:0 0 24px;color:#475569;font-size:14px;">Click below to verify your email address.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Verify my email</a>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
