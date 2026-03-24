import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { rsvpSchema } from "@/lib/validation";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notification-defaults";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const eventId = new ObjectId(parsed.data.eventId);
  const userId = new ObjectId(user._id);

  await db.collection("rsvps").updateOne(
    { eventId, userId },
    {
      $set: {
        status: parsed.data.status,
        comment: parsed.data.comment,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  if (parsed.data.status !== "going") {
    await db.collection("notificationQueue").deleteMany({
      userId,
      eventId,
      sent: false,
    });
  }

  if (parsed.data.status === "going") {
    const event = await db.collection("events").findOne({ _id: eventId });
    const prefs =
      (await db
        .collection("notificationPreferences")
        .findOne({ userId })) ?? DEFAULT_NOTIFICATION_PREFERENCES;

    if (event?.startDate && prefs.emailEnabled) {
      const start = new Date(event.startDate);
      const reminders: Array<{ type: string; days: number }> = [
        { type: "1day", days: 1 },
        { type: "1week", days: 7 },
        { type: "2weeks", days: 14 },
        { type: "1month", days: 30 },
      ];

      for (const reminder of reminders) {
        const enabled =
          (reminder.type === "1day" && prefs.reminder1Day) ||
          (reminder.type === "1week" && prefs.reminder1Week) ||
          (reminder.type === "2weeks" && prefs.reminder2Weeks) ||
          (reminder.type === "1month" && prefs.reminder1Month);

        if (!enabled) continue;
        const scheduledFor = new Date(start);
        scheduledFor.setDate(start.getDate() - reminder.days);

        await db.collection("notificationQueue").updateOne(
          {
            userId,
            eventId,
            notificationType: reminder.type,
          },
          {
            $set: {
              scheduledFor,
              sent: false,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }

      if (typeof prefs.reminderCustomDays === "number") {
        const scheduledFor = new Date(start);
        scheduledFor.setDate(start.getDate() - prefs.reminderCustomDays);
        await db.collection("notificationQueue").updateOne(
          {
            userId,
            eventId,
            notificationType: "custom",
          },
          {
            $set: {
              scheduledFor,
              sent: false,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }
  }

  return NextResponse.json({ success: true });
}
