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
  const startDate = new Date(parsed.data.startDate);
  const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;
  const duration = endDate ? endDate.getTime() - startDate.getTime() : 0;

  const recurring = parsed.data.recurring;
  const count = recurring?.endAfterCount ?? 1;
  const frequency = recurring?.frequency;

  function getIntervalMs(freq: string): number {
    if (freq === "weekly") return 7 * 24 * 60 * 60 * 1000;
    if (freq === "biweekly") return 14 * 24 * 60 * 60 * 1000;
    return 0; // monthly handled separately
  }

  function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  const seriesId = frequency && count > 1 ? new ObjectId() : undefined;
  const eventsToInsert = [];
  const totalCount = frequency ? Math.min(count, 52) : 1;

  for (let i = 0; i < totalCount; i++) {
    let eventStart: Date;
    let eventEnd: Date | undefined;

    if (i === 0) {
      eventStart = startDate;
      eventEnd = endDate;
    } else if (frequency === "monthly") {
      eventStart = addMonths(startDate, i);
      eventEnd = duration > 0 ? new Date(eventStart.getTime() + duration) : undefined;
    } else {
      const interval = getIntervalMs(frequency!);
      eventStart = new Date(startDate.getTime() + interval * i);
      eventEnd = duration > 0 ? new Date(eventStart.getTime() + duration) : undefined;
    }

    eventsToInsert.push({
      ...parsed.data,
      startDate: eventStart,
      endDate: eventEnd,
      creatorId: new ObjectId(user._id),
      seriesId,
      seriesIndex: frequency ? i : undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (eventsToInsert.length === 1) {
    const result = await db.collection("events").insertOne(eventsToInsert[0]);
    return NextResponse.json({
      event: { ...eventsToInsert[0], id: result.insertedId.toString() },
    });
  }

  // Insert series
  const result = await db.collection("events").insertMany(eventsToInsert);
  const firstId = result.insertedIds[0]?.toString();
  return NextResponse.json({
    event: { ...eventsToInsert[0], id: firstId },
    seriesCount: eventsToInsert.length,
  });
}
