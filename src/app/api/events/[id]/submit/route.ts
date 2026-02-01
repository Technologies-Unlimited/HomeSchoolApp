import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("events").updateOne(
    { _id: new ObjectId(params.id), creatorId: new ObjectId(user._id) },
    { $set: { status: "pending", updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
