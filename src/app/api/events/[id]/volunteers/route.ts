import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

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
  const slots = await db
    .collection("volunteerSlots")
    .find({ eventId: new ObjectId(id) })
    .sort({ createdAt: 1 })
    .toArray();

  const formattedSlots = slots.map((slot) => ({
    ...slot,
    id: slot._id.toString(),
    eventId: slot.eventId.toString(),
    createdBy: slot.createdBy.toString(),
    volunteers: (slot.volunteers ?? []).map(
      (volunteer: { userId: ObjectId; userName: string; signedUpAt: Date }) => ({
        ...volunteer,
        userId: volunteer.userId.toString(),
      })
    ),
  }));

  return NextResponse.json({ slots: formattedSlots });
}

export async function POST(
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
  const event = await db
    .collection("events")
    .findOne({ _id: new ObjectId(id) });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const isEventCreator =
    event.creatorId?.toString() === user._id.toString();
  if (!isEventCreator && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { role, description, spotsNeeded } = body;

  if (!role || typeof role !== "string" || role.trim().length === 0) {
    return NextResponse.json(
      { error: "Role is required." },
      { status: 400 }
    );
  }

  if (
    spotsNeeded === undefined ||
    typeof spotsNeeded !== "number" ||
    spotsNeeded < 1 ||
    !Number.isInteger(spotsNeeded)
  ) {
    return NextResponse.json(
      { error: "spotsNeeded must be a positive integer." },
      { status: 400 }
    );
  }

  const now = new Date();
  const slot = {
    eventId: new ObjectId(id),
    role: role.trim(),
    description: description && typeof description === "string" ? description.trim() : undefined,
    spotsNeeded,
    volunteers: [],
    createdBy: new ObjectId(user._id),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("volunteerSlots").insertOne(slot);

  return NextResponse.json(
    { slot: { ...slot, id: result.insertedId.toString(), eventId: id, createdBy: user._id.toString() } },
    { status: 201 }
  );
}
