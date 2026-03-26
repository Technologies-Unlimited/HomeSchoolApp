import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { eventSchema } from "@/lib/validation";
import { notifyAttendeesOfEventChange } from "@/lib/event-email";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDb();
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ event: { ...event, id: event._id.toString() } });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const existing = await db.collection("events").findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.creatorId?.toString() !== user._id.toString() && !isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = eventSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const update = {
      ...parsed.data,
      ...(parsed.data.startDate ? { startDate: new Date(parsed.data.startDate) } : {}),
      ...(parsed.data.endDate ? { endDate: new Date(parsed.data.endDate) } : {}),
      updatedAt: new Date(),
    };

    await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";
    await logAudit(db, {
      action: "event_updated",
      actorId: user.id,
      actorName,
      targetType: "event",
      targetId: id,
      details: `Updated event "${event?.title ?? existing.title}"`,
      previousState: { title: existing.title, description: existing.description, startDate: existing.startDate, endDate: existing.endDate, location: existing.location },
    });

    // Notify attendees if key fields changed
    const notifyFields = ["title", "startDate", "endDate", "location", "description"];
    const changed = notifyFields.some((f) => f in update);
    if (changed && existing.status === "published") {
      const changes: string[] = [];
      if (update.startDate) changes.push("Date/time updated");
      if (update.location) changes.push("Location updated");
      if (changes.length === 0) changes.push("Event details updated");
      notifyAttendeesOfEventChange(
        new ObjectId(id),
        event?.title ?? existing.title,
        "updated",
        changes.join(". ") + "."
      ).catch(() => {});
    }

    return NextResponse.json({ event: { ...event, id: event?._id.toString() } });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const existing = await db.collection("events").findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.creatorId?.toString() !== user._id.toString() && !isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );

    const cancelActorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";
    await logAudit(db, {
      action: "event_cancelled",
      actorId: user.id,
      actorName: cancelActorName,
      targetType: "event",
      targetId: id,
      details: `Cancelled event "${existing.title}"`,
      previousState: { status: existing.status },
    });

    if (existing.status === "published") {
      notifyAttendeesOfEventChange(
        new ObjectId(id),
        existing.title,
        "cancelled"
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
