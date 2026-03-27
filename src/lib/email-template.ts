/** Escape user-provided text for safe embedding in HTML emails */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shared branded email shell used by all transactional emails.
 * Pass an icon (emoji/HTML entity), headline, and body HTML.
 */
export function brandedEmail({
  icon,
  headline,
  subtitle,
  body,
  footerText,
}: {
  icon: string;
  headline: string;
  subtitle?: string;
  body: string;
  footerText?: string;
}) {
  const safeHeadline = escapeHtml(headline);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : undefined;
  const safeFooter = footerText ? escapeHtml(footerText) : undefined;
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);padding:40px 40px 32px;text-align:center;">
          <table cellpadding="0" cellspacing="0" align="center"><tr><td style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:50%;text-align:center;vertical-align:middle;font-size:24px;line-height:56px;">
            ${icon}
          </td></tr></table>
          <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${safeHeadline}</h1>
          ${safeSubtitle ? `<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);">${safeSubtitle}</p>` : ""}
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 40px 32px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
            ${safeFooter ?? "Home School Group"}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Renders a large rounded CTA button */
export function ctaButton(href: string, label: string) {
  return `<table cellpadding="0" cellspacing="0" align="center" style="margin:24px 0 8px;"><tr><td>
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(15,23,42,0.3);">
      ${label}
    </a>
  </td></tr></table>`;
}

/** Renders an info card with a light background */
export function infoCard(content: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin:16px 0;"><tr><td style="padding:16px 20px;">
    ${content}
  </td></tr></table>`;
}

/** Renders a detail row like "When: March 5, 2pm" */
export function detailRow(label: string, value: string) {
  return `<p style="margin:0 0 6px;font-size:14px;color:#475569;"><span style="font-weight:600;color:#1e293b;">${label}:</span> ${value}</p>`;
}
