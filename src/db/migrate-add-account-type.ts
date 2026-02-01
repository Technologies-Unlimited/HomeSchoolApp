/**
 * Migration: Add account_type to users table
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add account type to users...");

try {
  // Check if account_type column already exists
  const tableInfo = db.query("PRAGMA table_info(users)").all() as any[];
  const columnExists = tableInfo.some((col: any) => col.name === 'account_type');

  if (columnExists) {
    console.log("✅ Column 'account_type' already exists. Skipping migration.");
  } else {
    // Add the account_type column with default 'parent'
    db.run(`
      ALTER TABLE users
      ADD COLUMN account_type TEXT DEFAULT 'parent' CHECK(account_type IN ('parent', 'student'))
    `);
    console.log("✅ Successfully added 'account_type' column to users table.");

    // Set all existing users to 'parent' type
    db.run(`UPDATE users SET account_type = 'parent' WHERE account_type IS NULL`);
    console.log("✅ Set all existing users to 'parent' account type.");
  }
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
