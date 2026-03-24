import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notification-defaults";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const prefs = await db.collection("notificationPreferences").findOne({
    userId: new ObjectId(user._id),
  });

  return NextResponse.json({
    preferences: prefs ?? DEFAULT_NOTIFICATION_PREFERENCES,
  });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const prefs = {
    emailEnabled: Boolean(body?.emailEnabled),
    reminder1Day: Boolean(body?.reminder1Day),
    reminder1Week: Boolean(body?.reminder1Week),
    reminder2Weeks: Boolean(body?.reminder2Weeks),
    reminder1Month: Boolean(body?.reminder1Month),
    reminderCustomDays:
      typeof body?.reminderCustomDays === "number" &&
      body.reminderCustomDays >= 1 &&
      body.reminderCustomDays <= 365
        ? Math.floor(body.reminderCustomDays)
        : null,
  };

  const db = await getDb();
  await db.collection("notificationPreferences").updateOne(
    { userId: new ObjectId(user._id) },
    { $set: prefs },
    { upsert: true }
  );

  return NextResponse.json({ preferences: prefs });
}
