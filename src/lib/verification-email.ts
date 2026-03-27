import { escapeHtml } from "./email-template";

export function buildVerificationEmailHtml({
  firstName,
  verifyUrl,
}: {
  firstName: string;
  verifyUrl: string;
}) {
  const safeName = escapeHtml(firstName);
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header banner -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);padding:48px 40px 40px;text-align:center;">
          <table cellpadding="0" cellspacing="0" align="center"><tr><td style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;line-height:64px;">
            &#9993;
          </td></tr></table>
          <h1 style="margin:20px 0 8px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Verify Your Email</h1>
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);">Home School Group</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0 0 6px;font-size:14px;color:#94a3b8;">Hey ${safeName},</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1e293b;">
            Welcome to <strong>Home School Group</strong>! To get started, please verify your email address by clicking the button below.
          </p>
        </td></tr>

        <!-- Steps -->
        <tr><td style="padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="width:33.33%;padding:20px 12px;text-align:center;border-right:1px solid #e2e8f0;">
                <p style="margin:0 0 6px;font-size:22px;line-height:1;">&#9989;</p>
                <p style="margin:0;font-size:12px;font-weight:600;color:#1e293b;">Step 1</p>
                <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Verify email</p>
              </td>
              <td style="width:33.33%;padding:20px 12px;text-align:center;border-right:1px solid #e2e8f0;">
                <p style="margin:0 0 6px;font-size:22px;line-height:1;">&#128100;</p>
                <p style="margin:0;font-size:12px;font-weight:600;color:#1e293b;">Step 2</p>
                <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Admin review</p>
              </td>
              <td style="width:33.33%;padding:20px 12px;text-align:center;">
                <p style="margin:0 0 6px;font-size:22px;line-height:1;">&#127881;</p>
                <p style="margin:0;font-size:12px;font-weight:600;color:#1e293b;">Step 3</p>
                <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Full access</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA button -->
        <tr><td style="padding:0 40px 36px;text-align:center;">
          <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#ffffff;font-size:15px;font-weight:700;padding:16px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(15,23,42,0.3);">
            Verify My Email
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">This link expires in 48 hours</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
            If you didn't create this account, you can safely ignore this email.<br>
            Having trouble? Visit the app and click "Resend verification email".
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
