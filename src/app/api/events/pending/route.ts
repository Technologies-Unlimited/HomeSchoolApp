import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const events = await db
    .collection("events")
    .find({ status: "pending" })
    .sort({ startDate: 1 })
    .toArray();

  return NextResponse.json({
    events: events.map((event) => ({ ...event, id: event._id.toString() })),
  });
}
