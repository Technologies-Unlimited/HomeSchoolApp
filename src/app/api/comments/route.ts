import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { commentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const comment = {
    eventId: new ObjectId(parsed.data.eventId),
    userId: new ObjectId(user._id),
    userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    content: parsed.data.content,
    parentCommentId: parsed.data.parentCommentId
      ? new ObjectId(parsed.data.parentCommentId)
      : undefined,
    createdAt: now,
    updatedAt: now,
    likes: 0,
    edited: false,
    isDeleted: false,
  };

  const result = await db.collection("comments").insertOne(comment);
  return NextResponse.json({
    comment: { ...comment, id: result.insertedId.toString() },
  });
}
