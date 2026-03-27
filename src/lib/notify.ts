import { ObjectId, type Db } from "mongodb";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "./notification-defaults";

export type NotificationType =
  | "event_approved"
  | "event_rejected"
  | "event_rsvp"
  | "event_comment"
  | "comment_reply"
  | "waitlist_promoted"
  | "account_approved"
  | "announcement";

const TYPE_TO_PREF_KEY: Record<NotificationType, string> = {
  event_approved: "notifyEventApproved",
  event_rejected: "notifyEventRejected",
  event_rsvp: "notifyEventRsvp",
  event_comment: "notifyEventComment",
  comment_reply: "notifyCommentReply",
  waitlist_promoted: "notifyWaitlistPromoted",
  account_approved: "notifyEventApproved", // always notify — no separate toggle
  announcement: "notifyAnnouncement",
};

async function isNotificationEnabled(db: Db, userId: ObjectId, type: NotificationType): Promise<boolean> {
  // Account approved always notifies
  if (type === "account_approved") return true;

  const prefKey = TYPE_TO_PREF_KEY[type];
  const prefs = await db.collection("notificationPreferences").findOne({ userId });
  if (!prefs) return (DEFAULT_NOTIFICATION_PREFERENCES as Record<string, unknown>)[prefKey] !== false;
  return prefs[prefKey] !== false;
}

export async function createNotification(
  db: Db,
  {
    userId,
    type,
    message,
    linkUrl,
    eventId,
  }: {
    userId: ObjectId | string;
    type: NotificationType;
    message: string;
    linkUrl?: string;
    eventId?: ObjectId | string;
  }
) {
  const uid = typeof userId === "string" ? new ObjectId(userId) : userId;

  // Check if user has this notification type enabled
  if (!(await isNotificationEnabled(db, uid, type))) return;

  await db.collection("notifications").insertOne({
    userId: uid,
    type,
    message,
    linkUrl: linkUrl ?? null,
    eventId: eventId ? (typeof eventId === "string" ? new ObjectId(eventId) : eventId) : null,
    read: false,
    createdAt: new Date(),
  });
}

/** Create the same notification for multiple users, respecting each user's preferences */
export async function createNotificationForMany(
  db: Db,
  userIds: (ObjectId | string)[],
  notification: {
    type: NotificationType;
    message: string;
    linkUrl?: string;
    eventId?: ObjectId | string;
  }
) {
  if (userIds.length === 0) return;

  const resolvedIds = userIds.map((uid) => typeof uid === "string" ? new ObjectId(uid) : uid);

  // Fetch preferences for all users at once
  const prefKey = TYPE_TO_PREF_KEY[notification.type];
  const prefsResults = await db.collection("notificationPreferences")
    .find({ userId: { $in: resolvedIds } })
    .toArray();
  const prefsMap = new Map(prefsResults.map((p) => [p.userId.toString(), p]));

  const now = new Date();
  const docs = resolvedIds.filter((uid) => {
    const prefs = prefsMap.get(uid.toString());
    if (!prefs) return (DEFAULT_NOTIFICATION_PREFERENCES as Record<string, unknown>)[prefKey] !== false;
    return prefs[prefKey] !== false;
  }).map((uid) => ({
    userId: uid,
    type: notification.type,
    message: notification.message,
    linkUrl: notification.linkUrl ?? null,
    eventId: notification.eventId ? (typeof notification.eventId === "string" ? new ObjectId(notification.eventId) : notification.eventId) : null,
    read: false,
    createdAt: now,
  }));

  if (docs.length > 0) {
    await db.collection("notifications").insertMany(docs);
  }
}
