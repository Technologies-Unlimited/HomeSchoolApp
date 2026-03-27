import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });

    await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "published",
          approvedBy: new ObjectId(user._id),
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin";
    await logAudit(db, {
      action: "event_approved",
      actorId: user.id,
      actorName,
      targetType: "event",
      targetId: id,
      details: `Approved event "${event?.title ?? id}"`,
      previousState: { status: event?.status },
    });

    // Notify event creator
    if (event?.creatorId) {
      await createNotification(db, {
        userId: event.creatorId,
        type: "event_approved",
        message: `Your event "${event.title}" has been approved and is now live!`,
        linkUrl: `/events/${id}`,
        eventId: id,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
