/**
 * Migration: Add address fields and TOS acceptance to users, create contracts table
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add address and TOS fields...");

try {
  // Check if address fields already exist
  const tableInfo = db.query("PRAGMA table_info(users)").all() as any[];
  const addressExists = tableInfo.some((col: any) => col.name === 'address_line1');
  const tosExists = tableInfo.some((col: any) => col.name === 'tos_accepted_at');

  if (!addressExists) {
    // Add address fields to users table
    db.run(`ALTER TABLE users ADD COLUMN address_line1 TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN address_line2 TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN city TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN state TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN zip_code TEXT`);
    console.log("✅ Successfully added address fields to users table.");
  } else {
    console.log("✅ Address fields already exist.");
  }

  if (!tosExists) {
    // Add TOS acceptance fields
    db.run(`ALTER TABLE users ADD COLUMN tos_accepted_at DATETIME`);
    db.run(`ALTER TABLE users ADD COLUMN tos_version INTEGER`);
    console.log("✅ Successfully added TOS acceptance fields to users table.");
  } else {
    console.log("✅ TOS acceptance fields already exist.");
  }

  // Create contracts/TOS table
  db.run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      file_path TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
  console.log("✅ Successfully created 'contracts' table.");

  // Create index
  db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_active ON contracts(is_active, version)`);
  console.log("✅ Created indexes for contracts.");

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
