export function buildAnnouncementEmailHtml({
  title,
  content,
  authorName,
  priority,
}: {
  title: string;
  content: string;
  authorName: string;
  priority: string;
}) {
  const priorityBadge =
    priority === "urgent"
      ? `<span style="display:inline-block;background:#fef2f2;color:#991b1b;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px;">URGENT</span>`
      : priority === "important"
        ? `<span style="display:inline-block;background:#fffbeb;color:#92400e;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:8px;">IMPORTANT</span>`
        : "";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:8px;">Home School Group Announcement</p>
      <h2 style="font-size:20px;font-weight:600;margin:0 0 12px;">${title}${priorityBadge}</h2>
      <div style="font-size:14px;line-height:1.7;color:#475569;white-space:pre-wrap;">${content}</div>
      <p style="margin-top:20px;font-size:12px;color:#94a3b8;">Posted by ${authorName}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
      <p style="font-size:11px;color:#cbd5e1;">You received this because you are a member of the Home School Group.</p>
    </div>
  `;
}
