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
      const { brandedEmail, ctaButton } = await import("@/lib/email-template");
      await sendNotificationEmail({
        to: user.email,
        subject: "Reset your password — Home School Group",
        html: brandedEmail({
          icon: "&#128274;",
          headline: "Reset Your Password",
          body: `
            <p style="margin:0 0 6px;font-size:14px;color:#94a3b8;">Hey ${user.firstName},</p>
            <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#1e293b;">We received a request to reset your password. Click the button below to choose a new one.</p>
            ${ctaButton(resetUrl, "Reset Password")}
            <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;text-align:center;">This link expires in 1 hour</p>
          `,
          footerText: "If you didn't request this, you can safely ignore this email.",
        }),
      });
    } catch (err) {
      console.error("[FORGOT-PASSWORD] Failed to send email:", err);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
