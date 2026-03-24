import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, slotId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(slotId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = await getDb();
  const slot = await db.collection("volunteerSlots").findOne({
    _id: new ObjectId(slotId),
    eventId: new ObjectId(id),
  });

  if (!slot) {
    return NextResponse.json(
      { error: "Volunteer slot not found" },
      { status: 404 }
    );
  }

  const volunteers = slot.volunteers ?? [];
  const alreadySignedUp = volunteers.some(
    (volunteer: { userId: ObjectId }) =>
      volunteer.userId.toString() === user._id.toString()
  );

  if (alreadySignedUp) {
    return NextResponse.json(
      { error: "You are already signed up for this slot." },
      { status: 409 }
    );
  }

  if (volunteers.length >= slot.spotsNeeded) {
    return NextResponse.json(
      { error: "This volunteer slot is full." },
      { status: 409 }
    );
  }

  const volunteerEntry = {
    userId: new ObjectId(user._id),
    userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Unknown",
    signedUpAt: new Date(),
  };

  await db.collection("volunteerSlots").updateOne(
    { _id: new ObjectId(slotId) },
    {
      $push: { volunteers: volunteerEntry as never },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ success: true, volunteer: { ...volunteerEntry, userId: user._id.toString() } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, slotId } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(slotId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Allow removing a specific user via query param (admin only), otherwise remove self
  const url = new URL(request.url);
  const targetUserId = url.searchParams.get("userId") ?? user._id.toString();

  // If trying to remove someone else, must be admin
  if (targetUserId !== user._id.toString() && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isValidObjectId(targetUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const db = await getDb();
  const slot = await db.collection("volunteerSlots").findOne({
    _id: new ObjectId(slotId),
    eventId: new ObjectId(id),
  });

  if (!slot) {
    return NextResponse.json(
      { error: "Volunteer slot not found" },
      { status: 404 }
    );
  }

  const volunteers = slot.volunteers ?? [];
  const isVolunteer = volunteers.some(
    (volunteer: { userId: ObjectId }) =>
      volunteer.userId.toString() === targetUserId
  );

  if (!isVolunteer) {
    return NextResponse.json(
      { error: "User is not signed up for this slot." },
      { status: 404 }
    );
  }

  await db.collection("volunteerSlots").updateOne(
    { _id: new ObjectId(slotId) },
    {
      $pull: { volunteers: { userId: new ObjectId(targetUserId) } as never },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ success: true });
}
