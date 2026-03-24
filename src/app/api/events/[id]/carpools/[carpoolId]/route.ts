import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

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

  if (carpool.driverId.toString() !== user._id.toString() && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.collection("carpools").deleteOne({ _id: new ObjectId(carpoolId) });

  return NextResponse.json({ success: true });
}
