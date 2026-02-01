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
  const events = await db
    .collection("events")
    .find({ status: "draft", creatorId: new ObjectId(user._id) })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({
    events: events.map((event) => ({ ...event, id: event._id.toString() })),
  });
}
