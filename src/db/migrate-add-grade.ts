/**
 * Migration: Add grade field to children table
 */

import { getDB } from "./index.ts";

const db = getDB();

console.log("🔄 Running migration: Add grade field to children...");

try {
  // Check if grade column already exists
  const tableInfo = db.query("PRAGMA table_info(children)").all() as any[];
  const columnExists = tableInfo.some((col: any) => col.name === 'grade');

  if (columnExists) {
    console.log("✅ Column 'grade' already exists. Skipping migration.");
  } else {
    // Add the grade column
    db.run(`
      ALTER TABLE children
      ADD COLUMN grade TEXT
    `);
    console.log("✅ Successfully added 'grade' column to children table.");
  }
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

db.close();
console.log("✅ Migration complete!");
