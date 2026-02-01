import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/notifications";

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

      await sendNotificationEmail({
        to: user.email,
        subject: `Reminder: ${event.title}`,
        html: `<p>Reminder for <strong>${event.title}</strong> on ${new Date(
          event.startDate
        ).toLocaleString()}.</p>`,
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

export async function POST() {
  return processQueue();
}

export async function GET() {
  return processQueue();
}
