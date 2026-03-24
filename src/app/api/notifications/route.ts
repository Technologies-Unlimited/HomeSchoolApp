import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { limit, skip } = parsePagination(request.url);
  const db = await getDb();
  const notifications = await db
    .collection("notifications")
    .find({ userId: new ObjectId(user._id) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return NextResponse.json({
    notifications: notifications.map((item) => ({ ...item, id: item._id.toString() })),
  });
}
