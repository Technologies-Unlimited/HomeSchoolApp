import { Database } from "bun:sqlite";
import path from "path";

const dbPath = path.join(process.cwd(), "homeschool.db");
const db = new Database(dbPath);

console.log("🗄️  Setting up database...");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('super_admin', 'admin', 'event_creator', 'user')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'published', 'cancelled')),
    category TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    location_name TEXT,
    location_address TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    cost TEXT DEFAULT 'Free',
    age_range_type TEXT CHECK(age_range_type IN ('age', 'grade')),
    age_min INTEGER,
    age_max INTEGER,
    grade_min TEXT,
    grade_max TEXT,
    registration_deadline DATETIME,
    custom_fields TEXT,
    attachment_filename TEXT,
    attachment_path TEXT,
    image_url TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    form_type TEXT DEFAULT 'signup' CHECK(form_type IN ('signup', 'post-event-survey')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS form_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    field_order INTEGER NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text', 'textarea', 'number', 'email', 'select', 'radio', 'checkbox', 'date', 'file')),
    required INTEGER DEFAULT 0,
    placeholder TEXT,
    options TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS form_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS form_response_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL,
    field_id INTEGER NOT NULL,
    value TEXT,
    FOREIGN KEY (response_id) REFERENCES form_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('going', 'maybe', 'not-going')),
    comment TEXT,
    form_response_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (form_response_id) REFERENCES form_responses(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id INTEGER,
    likes INTEGER DEFAULT 0,
    edited INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    event_id INTEGER,
    comment_id INTEGER,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reminder_1day INTEGER DEFAULT 1,
    reminder_1week INTEGER DEFAULT 1,
    reminder_2weeks INTEGER DEFAULT 0,
    reminder_1month INTEGER DEFAULT 0,
    reminder_custom_days INTEGER,
    email_enabled INTEGER DEFAULT 1,
    new_event_notifications INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notification_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    rsvp_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    sent INTEGER DEFAULT 0,
    sent_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_date DATE,
    allergies TEXT,
    dietary_restrictions TEXT,
    medical_info TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS user_children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    relationship TEXT DEFAULT 'parent' CHECK(relationship IN ('parent', 'guardian', 'caregiver')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, child_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS linked_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    relationship_type TEXT DEFAULT 'spouse' CHECK(relationship_type IN ('spouse', 'partner', 'co-parent')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK(user1_id < user2_id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS event_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rsvp_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    attending INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rsvp_id, child_id),
    FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
  )
`);

// Create indexes for better query performance
db.run(`CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_comments_event ON comments(event_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_rsvps_user ON rsvps(user_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for, sent)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_user_children_user ON user_children(user_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_user_children_child ON user_children(child_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_event_attendees_rsvp ON event_attendees(rsvp_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_linked_accounts_users ON linked_accounts(user1_id, user2_id)`);

console.log("✅ Database tables created successfully!");
console.log(`📍 Database location: ${dbPath}`);

db.close();
