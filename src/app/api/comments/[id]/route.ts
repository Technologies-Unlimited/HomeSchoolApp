import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { parsePagination } from "@/lib/pagination";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const { limit, skip } = parsePagination(request.url);
  const db = await getDb();
  const comments = await db
    .collection("comments")
    .find({ eventId: new ObjectId(id), isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return NextResponse.json({
    comments: comments.map((comment) => ({ ...comment, id: comment._id.toString() })),
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

  const body = await request.json();
  const content = typeof body?.content === "string" ? body.content : "";
  if (!content) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("comments").updateOne(
    { _id: new ObjectId(id), userId: new ObjectId(user._id) },
    { $set: { content, edited: true, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
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
  const filter = isAdmin(user.role)
    ? { _id: new ObjectId(id) }
    : { _id: new ObjectId(id), userId: new ObjectId(user._id) };

  await db.collection("comments").updateOne(filter, {
    $set: { isDeleted: true, deletedBy: new ObjectId(user._id), updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
