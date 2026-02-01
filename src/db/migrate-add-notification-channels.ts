/**
 * Migration: Add notification channel preferences (email, sms, in-app)
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add notification channels...");

try {
  // Add SMS and in-app notification columns to notification_preferences
  const tableInfo = db.query("PRAGMA table_info(notification_preferences)").all() as any[];

  const smsExists = tableInfo.some((col: any) => col.name === 'sms_enabled');
  const inAppExists = tableInfo.some((col: any) => col.name === 'in_app_enabled');

  if (!smsExists) {
    db.run(`
      ALTER TABLE notification_preferences
      ADD COLUMN sms_enabled INTEGER DEFAULT 0
    `);
    console.log("✅ Added 'sms_enabled' column");
  }

  if (!inAppExists) {
    db.run(`
      ALTER TABLE notification_preferences
      ADD COLUMN in_app_enabled INTEGER DEFAULT 1
    `);
    console.log("✅ Added 'in_app_enabled' column");
  }

  // Create in_app_notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS in_app_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      event_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
  console.log("✅ Created 'in_app_notifications' table");

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
