import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { commentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
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

    // Notify parent comment author if this is a reply
    if (parsed.data.parentCommentId) {
      const parentComment = await db.collection("comments").findOne({
        _id: new ObjectId(parsed.data.parentCommentId),
      });
      if (parentComment && parentComment.userId.toString() !== user._id.toString()) {
        const event = await db.collection("events").findOne({ _id: comment.eventId });
        await db.collection("notifications").insertOne({
          userId: parentComment.userId,
          type: "comment_reply",
          message: `${comment.userName || "Someone"} replied to your comment on "${event?.title ?? "an event"}"`,
          eventId: comment.eventId,
          read: false,
          createdAt: now,
        });
      }
    }

    return NextResponse.json({
      comment: { ...comment, id: result.insertedId.toString() },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
