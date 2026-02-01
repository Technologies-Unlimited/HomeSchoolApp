/**
 * Migration: Add school_type to children and email verification fields
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add school type and email verification...");

try {
  // Check if school_type column already exists in children table
  const childrenTableInfo = db.query("PRAGMA table_info(children)").all() as any[];
  const schoolTypeExists = childrenTableInfo.some((col: any) => col.name === 'school_type');

  if (!schoolTypeExists) {
    db.run(`
      ALTER TABLE children
      ADD COLUMN school_type TEXT CHECK(school_type IN ('homeschool', 'public', 'private', 'college', 'not-enrolled'))
    `);
    console.log("✅ Successfully added 'school_type' column to children table.");
  } else {
    console.log("✅ Column 'school_type' already exists in children table.");
  }

  // Check if email verification fields already exist in users table
  const usersTableInfo = db.query("PRAGMA table_info(users)").all() as any[];
  const emailVerifiedExists = usersTableInfo.some((col: any) => col.name === 'email_verified');

  if (!emailVerifiedExists) {
    db.run(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`);
    db.run(`ALTER TABLE users ADD COLUMN verification_token TEXT`);
    db.run(`ALTER TABLE users ADD COLUMN verification_token_expires DATETIME`);
    console.log("✅ Successfully added email verification fields to users table.");

    // Mark all existing users as verified
    db.run(`UPDATE users SET email_verified = 1 WHERE email_verified = 0`);
    console.log("✅ Marked existing users as email verified.");
  } else {
    console.log("✅ Email verification fields already exist in users table.");
  }

  // Create email_verification_codes table for local development
  db.run(`
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email, code)
    )
  `);
  console.log("✅ Successfully created 'email_verification_codes' table.");

  // Create index for faster lookups
  db.run(`CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON email_verification_codes(email, expires_at)`);
  console.log("✅ Created indexes for email_verification_codes.");

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
