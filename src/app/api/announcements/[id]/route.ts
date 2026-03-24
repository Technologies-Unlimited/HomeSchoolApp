import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { isValidObjectId } from "@/lib/objectid";

const VALID_PRIORITIES = ["normal", "important", "urgent"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = await getDb();
  const announcement = await db.collection("announcements").findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true },
  });

  if (!announcement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    announcement: { ...announcement, id: announcement._id.toString() },
  });
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
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const existing = await db.collection("announcements").findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.title === "string" && body.title.trim().length > 0) {
    update.title = body.title.trim();
  }
  if (typeof body.content === "string" && body.content.trim().length > 0) {
    update.content = body.content.trim();
  }
  if (VALID_PRIORITIES.includes(body.priority)) {
    update.priority = body.priority;
  }
  if (typeof body.pinned === "boolean") {
    update.pinned = body.pinned;
  }

  await db.collection("announcements").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  const announcement = await db.collection("announcements").findOne({
    _id: new ObjectId(id),
  });

  return NextResponse.json({
    announcement: { ...announcement, id: announcement?._id.toString() },
  });
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
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const existing = await db.collection("announcements").findOne({
    _id: new ObjectId(id),
    isDeleted: { $ne: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.collection("announcements").updateOne(
    { _id: new ObjectId(id) },
    { $set: { isDeleted: true, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
