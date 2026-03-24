import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { eventSchema } from "@/lib/validation";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  const { limit, skip } = parsePagination(request.url);
  const db = await getDb();
  const events = await db
    .collection("events")
    .find({ status: "published" })
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return NextResponse.json({
    events: events.map((event) => ({ ...event, id: event._id.toString() })),
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const event = {
    ...parsed.data,
    startDate: new Date(parsed.data.startDate),
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    creatorId: new ObjectId(user._id),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("events").insertOne(event);
  return NextResponse.json({
    event: { ...event, id: result.insertedId.toString() },
  });
}
