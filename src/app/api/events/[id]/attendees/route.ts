import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDb();
  const attendees = await db
    .collection("rsvps")
    .find({ eventId: new ObjectId(params.id), status: "going" })
    .toArray();

  return NextResponse.json({
    attendees: attendees.map((item) => ({ ...item, id: item._id.toString() })),
  });
}
