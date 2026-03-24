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
  const carpools = await db
    .collection("carpools")
    .find({ eventId: new ObjectId(id) })
    .sort({ departureTime: 1, createdAt: -1 })
    .toArray();

  return NextResponse.json({
    carpools: carpools.map((carpool) => ({ ...carpool, id: carpool._id.toString() })),
  });
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
  const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const seatsAvailable = Number(body?.seatsAvailable);
  const departureLocation = typeof body?.departureLocation === "string" ? body.departureLocation.trim() : "";
  const departureTime = typeof body?.departureTime === "string" ? body.departureTime.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (!seatsAvailable || seatsAvailable < 1 || seatsAvailable > 20) {
    return NextResponse.json({ error: "Seats available must be between 1 and 20." }, { status: 400 });
  }
  if (!departureLocation) {
    return NextResponse.json({ error: "Departure location is required." }, { status: 400 });
  }
  if (!departureTime) {
    return NextResponse.json({ error: "Departure time is required." }, { status: 400 });
  }

  const driverName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";

  const now = new Date();
  const carpoolDocument = {
    eventId: new ObjectId(id),
    driverId: new ObjectId(user._id),
    driverName,
    seatsAvailable,
    departureLocation,
    departureTime,
    notes: notes || undefined,
    riders: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("carpools").insertOne(carpoolDocument);

  return NextResponse.json(
    { carpool: { ...carpoolDocument, id: result.insertedId.toString(), _id: result.insertedId } },
    { status: 201 }
  );
}
