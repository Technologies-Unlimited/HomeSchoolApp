import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; carpoolId: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, carpoolId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(carpoolId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = await getDb();
  const carpool = await db.collection("carpools").findOne({
    _id: new ObjectId(carpoolId),
    eventId: new ObjectId(id),
  });

  if (!carpool) {
    return NextResponse.json({ error: "Carpool not found" }, { status: 404 });
  }

  if (carpool.driverId.toString() === user._id.toString()) {
    return NextResponse.json({ error: "You cannot join your own carpool." }, { status: 400 });
  }

  const alreadyJoined = carpool.riders?.some(
    (rider: { userId: ObjectId }) => rider.userId.toString() === user._id.toString()
  );
  if (alreadyJoined) {
    return NextResponse.json({ error: "You have already joined this carpool." }, { status: 400 });
  }

  const currentRiderCount = carpool.riders?.length ?? 0;
  if (currentRiderCount >= carpool.seatsAvailable) {
    return NextResponse.json({ error: "This carpool is full." }, { status: 400 });
  }

  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";

  await db.collection("carpools").updateOne(
    { _id: new ObjectId(carpoolId) },
    {
      $push: {
        riders: {
          userId: new ObjectId(user._id),
          userName,
          joinedAt: new Date(),
        } as never,
      },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; carpoolId: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, carpoolId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(carpoolId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = await getDb();
  const carpool = await db.collection("carpools").findOne({
    _id: new ObjectId(carpoolId),
    eventId: new ObjectId(id),
  });

  if (!carpool) {
    return NextResponse.json({ error: "Carpool not found" }, { status: 404 });
  }

  const isRider = carpool.riders?.some(
    (rider: { userId: ObjectId }) => rider.userId.toString() === user._id.toString()
  );
  if (!isRider) {
    return NextResponse.json({ error: "You are not in this carpool." }, { status: 400 });
  }

  await db.collection("carpools").updateOne(
    { _id: new ObjectId(carpoolId) },
    {
      $pull: {
        riders: { userId: new ObjectId(user._id) } as never,
      },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ success: true });
}
