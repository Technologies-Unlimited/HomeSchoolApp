import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const rsvp = await db.collection("rsvps").findOne({
    eventId: new ObjectId(params.eventId),
    userId: new ObjectId(user._id),
  });

  return NextResponse.json({ rsvp: rsvp ? { ...rsvp, id: rsvp._id.toString() } : null });
}
