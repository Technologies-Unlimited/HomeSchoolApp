import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { isValidObjectId } from "@/lib/objectid";

const VALID_PRIORITIES = ["normal", "important", "urgent"] as const;
const VALID_VISIBILITIES = ["public", "members"] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const announcement = await db.collection("announcements").findOne({
      _id: new ObjectId(id),
      isDeleted: { $ne: true },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Members-only announcements require authentication
    if (announcement.visibility !== "public") {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({
      announcement: { ...announcement, id: announcement._id.toString() },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const existing = await db.collection("announcements").findOne({
      _id: new ObjectId(id),
      isDeleted: { $ne: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.title === "string" && body.title.trim().length > 0) {
      update.title = body.title.trim();
    }
    if (typeof body.content === "string" && body.content.trim().length > 0) {
      update.content = body.content.trim();
    }
    if (VALID_PRIORITIES.includes(body.priority)) {
      update.priority = body.priority;
    }
    if (typeof body.pinned === "boolean") {
      update.pinned = body.pinned;
    }
    if (VALID_VISIBILITIES.includes(body.visibility)) {
      update.visibility = body.visibility;
    }

    await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    const { logAudit } = await import("@/lib/audit");
    const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin";
    await logAudit(db, {
      action: "announcement_updated",
      actorId: user.id,
      actorName,
      targetType: "announcement",
      targetId: id,
      details: `Updated announcement "${existing.title}"`,
      previousState: { title: existing.title, content: existing.content, priority: existing.priority, visibility: existing.visibility, pinned: existing.pinned },
    });

    const announcement = await db.collection("announcements").findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      announcement: { ...announcement, id: announcement?._id.toString() },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const existing = await db.collection("announcements").findOne({
      _id: new ObjectId(id),
      isDeleted: { $ne: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );

    const { logAudit } = await import("@/lib/audit");
    const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin";
    await logAudit(db, {
      action: "announcement_deleted",
      actorId: user.id,
      actorName,
      targetType: "announcement",
      targetId: id,
      details: `Deleted announcement "${existing.title}"`,
      previousState: { title: existing.title, content: existing.content, isDeleted: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
