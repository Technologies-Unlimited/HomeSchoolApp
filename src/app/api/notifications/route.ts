import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const notifications = await db
    .collection("notifications")
    .find({ userId: new ObjectId(user._id) })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    notifications: notifications.map((item) => ({ ...item, id: item._id.toString() })),
  });
}
