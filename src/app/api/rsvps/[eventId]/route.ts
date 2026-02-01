import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const db = await getDb();
  const rsvps = await db
    .collection("rsvps")
    .find({ eventId: new ObjectId(params.eventId) })
    .toArray();

  return NextResponse.json({
    rsvps: rsvps.map((rsvp) => ({ ...rsvp, id: rsvp._id.toString() })),
  });
}
