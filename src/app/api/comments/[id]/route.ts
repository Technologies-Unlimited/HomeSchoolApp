import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const comments = await db
    .collection("comments")
    .find({ eventId: new ObjectId(id), isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
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
  const user = await getUserFromRequest(request as any);
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
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("comments").updateOne(
    { _id: new ObjectId(id), userId: new ObjectId(user._id) },
    { $set: { isDeleted: true, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
