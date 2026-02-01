/**
 * Migration: Add new_event_notifications column to notification_preferences
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add new_event_notifications column...");

try {
  // Check if column already exists
  const tableInfo = db.query("PRAGMA table_info(notification_preferences)").all() as any[];
  const columnExists = tableInfo.some((col: any) => col.name === 'new_event_notifications');

  if (columnExists) {
    console.log("✅ Column 'new_event_notifications' already exists. Skipping migration.");
  } else {
    // Add the column
    db.run(`
      ALTER TABLE notification_preferences
      ADD COLUMN new_event_notifications INTEGER DEFAULT 1
    `);
    console.log("✅ Successfully added 'new_event_notifications' column.");
  }
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
