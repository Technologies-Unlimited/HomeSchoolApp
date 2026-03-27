import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

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

    const body = await request.json().catch(() => ({}));
    const rejectionReason = typeof body?.reason === "string" ? body.reason : undefined;

    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) });

    await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "draft",
          rejectionReason,
          updatedAt: new Date(),
        },
      }
    );

    // Notify event creator
    if (event?.creatorId) {
      const { createNotification } = await import("@/lib/notify");
      await createNotification(db, {
        userId: event.creatorId,
        type: "event_rejected",
        message: `Your event "${event.title}" was sent back for revision${rejectionReason ? `: "${rejectionReason}"` : "."}`,
        linkUrl: `/events/${id}`,
        eventId: id,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
