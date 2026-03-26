import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { parsePagination } from "@/lib/pagination";
import { isValidObjectId } from "@/lib/objectid";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { limit, skip } = parsePagination(request.url);
  const url = new URL(request.url);
  const actionFilter = url.searchParams.get("action");
  const targetTypeFilter = url.searchParams.get("targetType");

  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (actionFilter) filter.action = actionFilter;
  if (targetTypeFilter) filter.targetType = targetTypeFilter;

  const [entries, total] = await Promise.all([
    db.collection("auditLog")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("auditLog").countDocuments(filter),
  ]);

  return NextResponse.json({
    entries: entries.map((entry) => ({
      id: entry._id.toString(),
      action: entry.action,
      actorName: entry.actorName,
      targetType: entry.targetType,
      targetId: entry.targetId.toString(),
      details: entry.details,
      hasRevertData: !!entry.previousState,
      createdAt: entry.createdAt,
    })),
    total,
  });
}

// Revert a specific audit entry
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { entryId } = body;

  if (!entryId || !isValidObjectId(entryId)) {
    return NextResponse.json({ error: "Valid entry ID required." }, { status: 400 });
  }

  const db = await getDb();
  const entry = await db.collection("auditLog").findOne({ _id: new ObjectId(entryId) });

  if (!entry) {
    return NextResponse.json({ error: "Audit entry not found." }, { status: 404 });
  }
  if (!entry.previousState) {
    return NextResponse.json({ error: "No revert data available for this action." }, { status: 400 });
  }

  // Determine the collection based on target type
  const collectionMap: Record<string, string> = {
    user: "users",
    event: "events",
    announcement: "announcements",
    invite: "invites",
    comment: "comments",
    rsvp: "rsvps",
  };

  const collectionName = collectionMap[entry.targetType];
  if (!collectionName) {
    return NextResponse.json({ error: "Unknown target type." }, { status: 400 });
  }

  // Restore the previous state
  const { _id, ...restoreData } = entry.previousState as Record<string, unknown>;
  await db.collection(collectionName).updateOne(
    { _id: new ObjectId(entry.targetId) },
    { $set: { ...restoreData, updatedAt: new Date() } }
  );

  // Log the revert action itself
  const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin";
  await logAudit(db, {
    action: "revert",
    actorId: user.id,
    actorName,
    targetType: entry.targetType,
    targetId: entry.targetId.toString(),
    details: `Reverted "${entry.action}" by ${entry.actorName}`,
  });

  return NextResponse.json({ success: true });
}
