import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { eventId } = await params;
    if (!isValidObjectId(eventId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const form = await db.collection("forms").findOne({
      eventId: new ObjectId(eventId),
      isActive: true,
    });

    if (!form) {
      return NextResponse.json({ form: null });
    }

    return NextResponse.json({ form: { ...form, id: form._id.toString() } });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
