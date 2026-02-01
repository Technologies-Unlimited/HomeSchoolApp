/**
 * Migration: Add onboarding_complete field and linking_requests table
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add onboarding fields...");

try {
  // Check if onboarding_complete column already exists
  const tableInfo = db.query("PRAGMA table_info(users)").all() as any[];
  const columnExists = tableInfo.some((col: any) => col.name === 'onboarding_complete');

  if (columnExists) {
    console.log("✅ Column 'onboarding_complete' already exists. Skipping users table migration.");
  } else {
    // Add the onboarding_complete column
    db.run(`
      ALTER TABLE users
      ADD COLUMN onboarding_complete INTEGER DEFAULT 0
    `);
    console.log("✅ Successfully added 'onboarding_complete' column.");

    // Set existing users as onboarded
    db.run(`UPDATE users SET onboarding_complete = 1`);
    console.log("✅ Marked existing users as onboarded.");
  }

  // Create linking_requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS linking_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      target_email TEXT NOT NULL,
      target_phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      relationship_type TEXT DEFAULT 'spouse' CHECK(relationship_type IN ('spouse', 'partner', 'co-parent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log("✅ Successfully created 'linking_requests' table.");

  // Create index for faster lookups
  db.run(`CREATE INDEX IF NOT EXISTS idx_linking_requests_target ON linking_requests(target_email, target_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_linking_requests_status ON linking_requests(status)`);
  console.log("✅ Created indexes for linking_requests.");

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
