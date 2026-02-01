import { Database } from "bun:sqlite";
import path from "path";

const dbPath = path.join(process.cwd(), "homeschool.db");

// Create singleton database connection
let db: Database | null = null;

export function getDB(): Database {
  if (!db) {
    db = new Database(dbPath);
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");
  }
  return db;
}

export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Helper type for database rows
export type DBUser = {
  id: number;
  email: string;
  phone: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'event_creator' | 'user';
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

export type DBEvent = {
  id: number;
  title: string;
  description: string | null;
  creator_id: number;
  status: 'draft' | 'pending' | 'published' | 'cancelled';
  category: string | null;
  start_date: string;
  end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  max_attendees: number | null;
  current_attendees: number;
  image_url: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DBComment = {
  id: number;
  event_id: number;
  user_id: number;
  content: string;
  parent_comment_id: number | null;
  likes: number;
  edited: number;
  is_deleted: number;
  deleted_by: number | null;
  created_at: string;
  updated_at: string;
};

export type DBRSVP = {
  id: number;
  event_id: number;
  user_id: number;
  status: 'going' | 'maybe' | 'not-going';
  comment: string | null;
  form_response_id: number | null;
  created_at: string;
  updated_at: string;
};
