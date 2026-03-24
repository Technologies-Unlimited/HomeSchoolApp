import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

async function ensureIndexes() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = process.env.MONGODB_DB_NAME ? client.db(process.env.MONGODB_DB_NAME) : client.db();

  console.log("Creating indexes...");

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  console.log("  users.email (unique)");

  await db.collection("rsvps").createIndex({ eventId: 1, userId: 1 }, { unique: true });
  console.log("  rsvps.{eventId, userId} (unique)");

  await db.collection("notificationQueue").createIndex(
    { userId: 1, eventId: 1, notificationType: 1 },
    { unique: true }
  );
  console.log("  notificationQueue.{userId, eventId, notificationType} (unique)");

  await db.collection("notificationQueue").createIndex({ sent: 1, scheduledFor: 1 });
  console.log("  notificationQueue.{sent, scheduledFor}");

  await db.collection("events").createIndex({ status: 1, startDate: 1 });
  console.log("  events.{status, startDate}");

  await db.collection("comments").createIndex({ eventId: 1, createdAt: -1 });
  console.log("  comments.{eventId, createdAt}");

  console.log("Done!");
  await client.close();
}

ensureIndexes().catch((error) => {
  console.error("Failed to create indexes:", error);
  process.exit(1);
});
