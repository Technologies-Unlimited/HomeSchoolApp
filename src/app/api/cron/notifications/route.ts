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

      const eventDate = new Date(event.startDate).toLocaleString();
      const locationText = event.location?.name
        ? `<p style="margin:0 0 8px;color:#64748b;font-size:14px;">Location: ${event.location.name}${event.location.address ? ` — ${event.location.address}` : ""}</p>`
        : "";

      await sendNotificationEmail({
        to: user.email,
        subject: `Reminder: ${event.title} — ${eventDate}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Upcoming Event Reminder</h2>
            <div style="padding:20px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
              <h3 style="margin:0 0 8px;color:#0f172a;font-size:18px;">${event.title}</h3>
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">When: ${eventDate}</p>
              ${locationText}
              ${event.description ? `<p style="margin:12px 0 0;color:#475569;font-size:14px;">${event.description}</p>` : ""}
            </div>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
              You're receiving this because you RSVP'd to this event on Home School Group.
            </p>
          </div>
        `,
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
