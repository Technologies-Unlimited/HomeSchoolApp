import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.eventId || !Array.isArray(body?.fields)) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const form = {
    eventId: new ObjectId(body.eventId),
    creatorId: new ObjectId(user._id),
    formType: body.formType ?? "signup",
    isActive: Boolean(body.isActive ?? true),
    fields: body.fields,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("forms").insertOne(form);
  return NextResponse.json({ form: { ...form, id: result.insertedId.toString() } });
}
