import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function POST(
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
  const result = await db.collection("events").updateOne(
    { _id: new ObjectId(id), creatorId: new ObjectId(user._id), status: "draft" },
    { $set: { status: "pending", updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Event not found, not owned by you, or not in draft status." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
