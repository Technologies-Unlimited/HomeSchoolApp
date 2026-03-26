import { getDb } from "./db";
import { sendNotificationEmail } from "./notifications";
import { ObjectId } from "mongodb";

export async function notifyAttendeesOfEventChange(
  eventId: ObjectId,
  eventTitle: string,
  changeType: "updated" | "cancelled",
  changeDetails?: string
) {
  const db = await getDb();

  const rsvps = await db
    .collection("rsvps")
    .find({ eventId, status: "going" })
    .toArray();

  if (rsvps.length === 0) return;

  const userIds = rsvps.map((r) => r.userId);
  const users = await db
    .collection("users")
    .find({ _id: { $in: userIds } }, { projection: { email: 1 } })
    .toArray();

  const subject =
    changeType === "cancelled"
      ? `Event cancelled: ${eventTitle}`
      : `Event updated: ${eventTitle}`;

  const headline =
    changeType === "cancelled"
      ? "An event you RSVP'd to has been cancelled"
      : "An event you RSVP'd to has been updated";

  const detailBlock = changeDetails
    ? `<p style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;font-size:14px;color:#475569;">${changeDetails}</p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1e293b;">
      <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">${headline}</h2>
      <p style="margin:0 0 16px;padding:10px 16px;background:${changeType === "cancelled" ? "#fef2f2" : "#eff6ff"};border-radius:8px;font-size:15px;font-weight:600;color:${changeType === "cancelled" ? "#991b1b" : "#1e40af"};">${eventTitle}</p>
      ${detailBlock}
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">You received this email because you RSVP'd to this event.</p>
    </div>
  `;

  const sendPromises = users.map((u) =>
    sendNotificationEmail({ to: u.email, subject, html }).catch((err) =>
      console.error(`[EVENT-EMAIL] Failed to send to ${u.email}:`, err)
    )
  );

  await Promise.allSettled(sendPromises);
}
