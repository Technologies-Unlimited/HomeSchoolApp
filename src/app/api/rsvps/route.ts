import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { rsvpSchema } from "@/lib/validation";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notification-defaults";

export async function POST(request: Request) {
  try {
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

    // Enforce capacity when RSVPing "going"
    let actualStatus: string = parsed.data.status;
    if (parsed.data.status === "going") {
      const event = await db.collection("events").findOne({ _id: eventId });
      if (event?.maxAttendees) {
        const existingRsvp = await db.collection("rsvps").findOne({ eventId, userId });
        const alreadyGoing = existingRsvp?.status === "going";
        if (!alreadyGoing) {
          const goingCount = await db.collection("rsvps").countDocuments({ eventId, status: "going" });
          if (goingCount >= event.maxAttendees) {
            // Auto-waitlist instead of rejecting
            const waitlistCount = await db.collection("rsvps").countDocuments({ eventId, status: "waitlisted" });
            actualStatus = "waitlisted";

            await db.collection("rsvps").updateOne(
              { eventId, userId },
              {
                $set: {
                  status: "waitlisted",
                  waitlistPosition: waitlistCount + 1,
                  comment: parsed.data.comment,
                  adultCount: parsed.data.adultCount ?? 1,
                  childrenNames: parsed.data.childrenNames ?? [],
                  updatedAt: now,
                },
                $setOnInsert: { createdAt: now },
              },
              { upsert: true }
            );

            return NextResponse.json({ success: true, status: "waitlisted", waitlistPosition: waitlistCount + 1 });
          }
        }
      }
    }

    // If changing from "going" to something else, promote next waitlisted person
    if (parsed.data.status !== "going") {
      const existingRsvp = await db.collection("rsvps").findOne({ eventId, userId });
      if (existingRsvp?.status === "going") {
        const nextWaitlisted = await db.collection("rsvps")
          .find({ eventId, status: "waitlisted" })
          .sort({ waitlistPosition: 1 })
          .limit(1)
          .toArray();

        if (nextWaitlisted.length > 0) {
          const promoted = nextWaitlisted[0];
          await db.collection("rsvps").updateOne(
            { _id: promoted._id },
            { $set: { status: "going", waitlistPosition: null, updatedAt: new Date() } }
          );

          // Notify promoted user
          const promotedUser = await db.collection("users").findOne(
            { _id: promoted.userId },
            { projection: { email: 1 } }
          );
          const event = await db.collection("events").findOne({ _id: eventId });
          if (promotedUser?.email && event) {
            const { sendNotificationEmail } = await import("@/lib/notifications");
            const { brandedEmail } = await import("@/lib/email-template");
            sendNotificationEmail({
              to: promotedUser.email,
              subject: `A spot opened up: ${event.title}`,
              html: brandedEmail({
                icon: "&#127881;",
                headline: "You're Off the Waitlist!",
                subtitle: event.title,
                body: `<p style="margin:0;font-size:15px;line-height:1.6;color:#1e293b;">Great news — a spot opened up for <strong>${event.title}</strong> and you've been automatically moved from the waitlist to <span style="color:#16a34a;font-weight:600;">going</span>. See you there!</p>`,
                footerText: "You received this because you were on the waitlist for this event.",
              }),
            }).catch(() => {});
          }

          // In-app notification for promoted user
          if (event) {
            const { createNotification } = await import("@/lib/notify");
            await createNotification(db, {
              userId: promoted.userId,
              type: "waitlist_promoted",
              message: `A spot opened up for "${event.title}" — you're now going!`,
              linkUrl: `/events/${eventId.toString()}`,
              eventId,
            });
          }
        }
      }
    }

    await db.collection("rsvps").updateOne(
      { eventId, userId },
      {
        $set: {
          status: parsed.data.status,
          comment: parsed.data.comment,
          adultCount: parsed.data.adultCount ?? 1,
          childrenNames: parsed.data.childrenNames ?? [],
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

    // Notify event creator when someone RSVPs "going"
    if (parsed.data.status === "going") {
      const rsvpEvent = await db.collection("events").findOne({ _id: eventId });
      if (rsvpEvent?.creatorId && rsvpEvent.creatorId.toString() !== user._id.toString()) {
        const rsvpUserName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Someone";
        const { createNotification } = await import("@/lib/notify");
        await createNotification(db, {
          userId: rsvpEvent.creatorId,
          type: "event_rsvp",
          message: `${rsvpUserName} RSVP'd going to "${rsvpEvent.title}"`,
          linkUrl: `/events/${eventId.toString()}`,
          eventId,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
