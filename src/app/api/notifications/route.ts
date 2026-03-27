import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { limit, skip } = parsePagination(request.url);
    const db = await getDb();

    const [notifications, unreadCount] = await Promise.all([
      db
        .collection("notifications")
        .find({ userId: new ObjectId(user._id) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db
        .collection("notifications")
        .countDocuments({ userId: new ObjectId(user._id), read: false }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((item) => ({
        id: item._id.toString(),
        type: item.type,
        message: item.message,
        linkUrl: item.linkUrl ?? null,
        read: item.read ?? false,
        createdAt: item.createdAt,
      })),
      unreadCount,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = await getDb();

    if (body.markAllRead) {
      // Mark all as read
      await db.collection("notifications").updateMany(
        { userId: new ObjectId(user._id), read: false },
        { $set: { read: true } }
      );
    } else if (body.notificationId) {
      // Mark single as read
      await db.collection("notifications").updateOne(
        { _id: new ObjectId(body.notificationId), userId: new ObjectId(user._id) },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
