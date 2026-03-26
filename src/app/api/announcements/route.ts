import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { parsePagination } from "@/lib/pagination";

const VALID_PRIORITIES = ["normal", "important", "urgent"] as const;

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  const { limit, skip, page } = parsePagination(request.url);
  const db = await getDb();

  const now = new Date();
  const filter: Record<string, unknown> = {
    isDeleted: { $ne: true },
    $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }],
  };

  // Unauthenticated users only see public announcements
  if (!user) {
    filter.visibility = "public";
  }

  const [announcements, total] = await Promise.all([
    db
      .collection("announcements")
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("announcements").countDocuments(filter),
  ]);

  return NextResponse.json({
    announcements: announcements.map((announcement) => ({
      ...announcement,
      id: announcement._id.toString(),
    })),
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, content, priority, pinned } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  const VALID_VISIBILITIES = ["public", "members"] as const;
  const resolvedVisibility = VALID_VISIBILITIES.includes(body.visibility) ? body.visibility : "members";
  const resolvedPriority = VALID_PRIORITIES.includes(priority) ? priority : "normal";
  const resolvedPinned = typeof pinned === "boolean" ? pinned : false;

  const db = await getDb();
  const now = new Date();
  const publishAt = body.publishAt ? new Date(body.publishAt) : null;

  const announcement = {
    title: title.trim(),
    content: content.trim(),
    priority: resolvedPriority,
    visibility: resolvedVisibility,
    pinned: resolvedPinned,
    publishAt,
    authorId: new ObjectId(user._id),
    authorName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown",
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("announcements").insertOne(announcement);

  // Audit log
  const { logAudit } = await import("@/lib/audit");
  await logAudit(db, {
    action: "announcement_created",
    actorId: user.id,
    actorName: announcement.authorName,
    targetType: "announcement",
    targetId: result.insertedId.toString(),
    details: `Created announcement "${title.trim()}"`,
  });

  // Optionally email all approved members
  if (body.emailToMembers === true && !publishAt) {
    const { sendNotificationEmail } = await import("@/lib/notifications");
    const { buildAnnouncementEmailHtml } = await import("@/lib/announcement-email");
    const members = await db.collection("users")
      .find({ approved: true, isActive: { $ne: false } }, { projection: { email: 1 } })
      .toArray();

    const html = buildAnnouncementEmailHtml({
      title: title.trim(),
      content: content.trim(),
      authorName: announcement.authorName,
      priority: resolvedPriority,
    });

    const sendPromises = members.map((m) =>
      sendNotificationEmail({ to: m.email, subject: `${title.trim()} — Home School Group`, html }).catch(() => {})
    );
    Promise.allSettled(sendPromises).catch(() => {});
  }

  return NextResponse.json({
    announcement: { ...announcement, id: result.insertedId.toString() },
  });
}
