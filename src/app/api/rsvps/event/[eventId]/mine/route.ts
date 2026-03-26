import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  if (!isValidObjectId(eventId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const rsvp = await db.collection("rsvps").findOne({
      eventId: new ObjectId(eventId),
      userId: new ObjectId(user._id),
    });

    return NextResponse.json({ rsvp: rsvp ? { ...rsvp, id: rsvp._id.toString() } : null });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
