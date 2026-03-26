import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );

    const { getBaseUrl } = await import("@/lib/base-url");
    const resetUrl = `${getBaseUrl()}/reset-password/${resetToken}`;

    try {
      await sendNotificationEmail({
        to: user.email,
        subject: "Reset your password — Home School Group",
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Password Reset</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;">Hi ${user.firstName}, click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Reset password</a>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[FORGOT-PASSWORD] Failed to send email:", err);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
