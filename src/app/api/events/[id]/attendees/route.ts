import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const db = await getDb();
  const rsvps = await db
    .collection("rsvps")
    .find({ eventId: new ObjectId(id) })
    .toArray();

  const userIds = rsvps.map((rsvp) => new ObjectId(rsvp.userId));
  const users = userIds.length > 0
    ? await db.collection("users")
        .find({ _id: { $in: userIds } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
        .toArray()
    : [];

  const userMap = new Map(users.map((userDoc) => [userDoc._id.toString(), userDoc]));

  const attendees = rsvps.map((rsvp) => {
    const userDoc = userMap.get(rsvp.userId.toString());
    return {
      id: rsvp._id.toString(),
      status: rsvp.status,
      name: userDoc
        ? `${userDoc.firstName ?? ""} ${userDoc.lastName ?? ""}`.trim() || userDoc.email
        : "Unknown",
    };
  });

  return NextResponse.json({ attendees });
}
