import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { eventSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const db = await getDb();
  const event = await db.collection("events").findOne({
    _id: new ObjectId(id),
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ event: { ...event, id: event._id.toString() } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const existing = await db.collection("events").findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.creatorId?.toString() !== user._id.toString() && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const update = {
    ...parsed.data,
    ...(parsed.data.startDate ? { startDate: new Date(parsed.data.startDate) } : {}),
    ...(parsed.data.endDate ? { endDate: new Date(parsed.data.endDate) } : {}),
    updatedAt: new Date(),
  };

  await db.collection("events").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  const event = await db.collection("events").findOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({ event: { ...event, id: event?._id.toString() } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const existing = await db.collection("events").findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.creatorId?.toString() !== user._id.toString() && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.collection("events").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "cancelled", updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
