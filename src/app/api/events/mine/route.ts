import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userId = new ObjectId(user._id);

    // Get events the user RSVP'd to (going or waitlisted)
    const rsvps = await db
      .collection("rsvps")
      .find({ userId, status: { $in: ["going", "waitlisted", "maybe"] } })
      .toArray();
    const rsvpEventIds = rsvps.map((r) => r.eventId);
    const rsvpStatusMap = new Map(rsvps.map((r) => [r.eventId.toString(), r.status]));

    // Get events the user created
    const createdEvents = await db
      .collection("events")
      .find({ creatorId: userId, status: { $ne: "cancelled" } })
      .sort({ startDate: 1 })
      .toArray();
    const createdEventIds = new Set(createdEvents.map((e) => e._id.toString()));

    // Get RSVP'd events (excluding ones they also created to avoid duplicates)
    const rsvpEvents = rsvpEventIds.length > 0
      ? await db
          .collection("events")
          .find({ _id: { $in: rsvpEventIds }, status: "published" })
          .sort({ startDate: 1 })
          .toArray()
      : [];

    const formatEvent = (event: Record<string, unknown>, rsvpStatus?: string) => ({
      ...event,
      id: (event._id as ObjectId).toString(),
      rsvpStatus,
    });

    return NextResponse.json({
      rsvpd: rsvpEvents
        .filter((e) => !createdEventIds.has(e._id.toString()))
        .map((e) => formatEvent(e, rsvpStatusMap.get(e._id.toString()))),
      created: createdEvents.map((e) => formatEvent(e, rsvpStatusMap.get(e._id.toString()))),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
