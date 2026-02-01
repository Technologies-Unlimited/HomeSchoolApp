/**
 * Migration: Add event_documents table for file attachments
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add event documents...");

try {
  // Create event_documents table
  db.run(`
    CREATE TABLE IF NOT EXISTS event_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      storage_type TEXT DEFAULT 'local',
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);
  console.log("✅ Created 'event_documents' table");

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
