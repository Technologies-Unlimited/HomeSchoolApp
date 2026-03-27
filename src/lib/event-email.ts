import { getDb } from "./db";
import { sendNotificationEmail } from "./notifications";
import { ObjectId } from "mongodb";
import { brandedEmail, infoCard } from "./email-template";

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

  const icon = changeType === "cancelled" ? "&#10060;" : "&#128221;";
  const headline = changeType === "cancelled" ? "Event Cancelled" : "Event Updated";

  const detailBlock = changeDetails
    ? infoCard(`<p style="margin:0;font-size:14px;color:#475569;">${changeDetails}</p>`)
    : "";

  const html = brandedEmail({
    icon,
    headline,
    subtitle: eventTitle,
    body: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1e293b;">
        ${changeType === "cancelled"
          ? `The event <strong>${eventTitle}</strong> that you RSVP'd to has been <span style="color:#dc2626;font-weight:600;">cancelled</span>.`
          : `The event <strong>${eventTitle}</strong> that you RSVP'd to has been updated with new details.`
        }
      </p>
      ${detailBlock}
    `,
    footerText: "You received this email because you RSVP'd to this event.",
  });

  const sendPromises = users.map((u) =>
    sendNotificationEmail({ to: u.email, subject, html }).catch(() => {})
  );

  await Promise.allSettled(sendPromises);
}
