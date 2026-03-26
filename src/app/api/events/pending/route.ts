import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { limit, skip } = parsePagination(request.url);
    const db = await getDb();
    const events = await db
      .collection("events")
      .find({ status: "pending" })
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      events: events.map((event) => ({ ...event, id: event._id.toString() })),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
