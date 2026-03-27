import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/notifications";

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET environment variable is not set — blocking request");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

async function processQueue() {
  const db = await getDb();
  const now = new Date();

  const queue = await db
    .collection("notificationQueue")
    .find({ sent: { $ne: true }, scheduledFor: { $lte: now } })
    .limit(50)
    .toArray();

  const results = [];

  for (const item of queue) {
    try {
      const user = await db.collection("users").findOne({
        _id: new ObjectId(item.userId),
      });
      const event = await db.collection("events").findOne({
        _id: new ObjectId(item.eventId),
      });

      if (!user?.email || !event) {
        await db.collection("notificationQueue").updateOne(
          { _id: item._id },
          { $set: { sent: true, sentAt: new Date(), errorMessage: "Missing data" } }
        );
        continue;
      }

      const { brandedEmail, infoCard, detailRow } = await import("@/lib/email-template");
      const eventDate = new Date(event.startDate).toLocaleString();

      await sendNotificationEmail({
        to: user.email,
        subject: `Reminder: ${event.title} — ${eventDate}`,
        html: brandedEmail({
          icon: "&#128276;",
          headline: "Event Reminder",
          subtitle: event.title,
          body: `
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1e293b;">You have an upcoming event you RSVP'd to:</p>
            ${infoCard(`
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a;">${event.title}</p>
              ${detailRow("When", eventDate)}
              ${event.location?.name ? detailRow("Where", `${event.location.name}${event.location.address ? ` — ${event.location.address}` : ""}`) : ""}
              ${event.description ? `<p style="margin:8px 0 0;font-size:13px;color:#64748b;">${event.description}</p>` : ""}
            `)}
          `,
          footerText: "You received this because you RSVP'd to this event on Home School Group.",
        }),
      });

      await db.collection("notificationQueue").updateOne(
        { _id: item._id },
        { $set: { sent: true, sentAt: new Date() } }
      );
      results.push({ id: item._id.toString(), status: "sent" });
    } catch (error) {
      await db.collection("notificationQueue").updateOne(
        { _id: item._id },
        { $set: { errorMessage: (error as Error).message } }
      );
      results.push({ id: item._id.toString(), status: "failed" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return processQueue();
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return processQueue();
}
