import { ObjectId, type Db } from "mongodb";

export interface AuditEntry {
  action: string;
  actorId: ObjectId;
  actorName: string;
  targetType: "user" | "event" | "announcement" | "invite" | "comment" | "rsvp";
  targetId: ObjectId;
  details: string;
  previousState?: Record<string, unknown>;
  createdAt: Date;
}

export async function logAudit(
  db: Db,
  entry: {
    action: string;
    actorId: string;
    actorName: string;
    targetType: AuditEntry["targetType"];
    targetId: string;
    details: string;
    previousState?: Record<string, unknown>;
  }
) {
  await db.collection("auditLog").insertOne({
    action: entry.action,
    actorId: new ObjectId(entry.actorId),
    actorName: entry.actorName,
    targetType: entry.targetType,
    targetId: new ObjectId(entry.targetId),
    details: entry.details,
    previousState: entry.previousState ?? null,
    createdAt: new Date(),
  });
}
