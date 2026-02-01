import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const db = await getDb();
  const form = await db.collection("forms").findOne({
    eventId: new ObjectId(params.eventId),
    isActive: true,
  });

  if (!form) {
    return NextResponse.json({ form: null });
  }

  return NextResponse.json({ form: { ...form, id: form._id.toString() } });
}
