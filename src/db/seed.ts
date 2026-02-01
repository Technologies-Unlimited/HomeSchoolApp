import { getDB } from "./index.ts";
import bcrypt from "bcryptjs";

const db = getDB();

console.log("🌱 Seeding database...");

// Disable foreign key constraints temporarily
db.run("PRAGMA foreign_keys = OFF");

// Clear existing data
console.log("Clearing existing data...");
db.run("DELETE FROM notifications");
db.run("DELETE FROM comments");
db.run("DELETE FROM form_response_values");
db.run("DELETE FROM form_responses");
db.run("DELETE FROM rsvps");
db.run("DELETE FROM form_fields");
db.run("DELETE FROM forms");
db.run("DELETE FROM events");
db.run("DELETE FROM user_children");
db.run("DELETE FROM children");
db.run("DELETE FROM contracts");
db.run("DELETE FROM users");

// Reset auto-increment
db.run("DELETE FROM sqlite_sequence");

// Re-enable foreign key constraints
db.run("PRAGMA foreign_keys = ON");

// Create users
console.log("Creating users...");
const passwordHash = bcrypt.hashSync("admin123", 10);

const users = [
  {
    email: "admin@homeschool.com",
    phone: "(555) 000-0000",
    password_hash: passwordHash,
    first_name: "Admin",
    last_name: "User",
    role: "super_admin"
  },
  {
    email: "sarah.johnson@email.com",
    phone: "(555) 123-4567",
    password_hash: bcrypt.hashSync("password123", 10),
    first_name: "Sarah",
    last_name: "Johnson",
    role: "event_creator"
  },
  {
    email: "mike.davis@email.com",
    phone: "(555) 234-5678",
    password_hash: bcrypt.hashSync("password123", 10),
    first_name: "Mike",
    last_name: "Davis",
    role: "user"
  },
  {
    email: "emily.parker@email.com",
    phone: "(555) 345-6789",
    password_hash: bcrypt.hashSync("password123", 10),
    first_name: "Emily",
    last_name: "Parker",
    role: "admin"
  }
];

const insertUser = db.prepare(`
  INSERT INTO users (email, phone, password_hash, first_name, last_name, role, email_verified, account_type, tos_accepted_at, tos_version)
  VALUES (?, ?, ?, ?, ?, ?, 1, 'parent', ?, 1)
`);

// Set TOS acceptance date to 5 days ago
const tosAcceptedDate = new Date();
tosAcceptedDate.setDate(tosAcceptedDate.getDate() - 5);

for (const user of users) {
  insertUser.run(
    user.email,
    user.phone,
    user.password_hash,
    user.first_name,
    user.last_name,
    user.role,
    tosAcceptedDate.toISOString()
  );
}

console.log(`✅ Created ${users.length} users`);

// Create children
console.log("Creating children...");
const children = [
  {
    name: "Emma Johnson",
    birth_date: "2013-04-15",
    grade: "6",
    school_type: "homeschool",
    allergies: "Peanuts",
    dietary_restrictions: null,
    medical_info: null,
    notes: null
  },
  {
    name: "Noah Johnson",
    birth_date: "2015-08-22",
    grade: "4",
    school_type: "homeschool",
    allergies: null,
    dietary_restrictions: "Vegetarian",
    medical_info: null,
    notes: null
  },
  {
    name: "Olivia Davis",
    birth_date: "2014-01-10",
    grade: "5",
    school_type: "public",
    allergies: null,
    dietary_restrictions: null,
    medical_info: "Asthma - has inhaler",
    notes: "Loves art projects"
  },
  {
    name: "Liam Davis",
    birth_date: "2016-11-05",
    grade: "3",
    school_type: "public",
    allergies: null,
    dietary_restrictions: null,
    medical_info: null,
    notes: null
  },
  {
    name: "Sophia Parker",
    birth_date: "2012-06-18",
    grade: "7",
    school_type: "private",
    allergies: "Dairy",
    dietary_restrictions: "Lactose intolerant",
    medical_info: null,
    notes: "Interested in science experiments"
  },
  {
    name: "Mason Parker",
    birth_date: "2014-09-30",
    grade: "5",
    school_type: "private",
    allergies: null,
    dietary_restrictions: null,
    medical_info: null,
    notes: "Plays soccer"
  },
  {
    name: "Ava Parker",
    birth_date: "2017-03-12",
    grade: "2",
    school_type: "private",
    allergies: null,
    dietary_restrictions: null,
    medical_info: null,
    notes: null
  }
];

const insertChild = db.prepare(`
  INSERT INTO children (name, birth_date, grade, school_type, allergies, dietary_restrictions, medical_info, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const child of children) {
  insertChild.run(
    child.name,
    child.birth_date,
    child.grade,
    child.school_type,
    child.allergies,
    child.dietary_restrictions,
    child.medical_info,
    child.notes
  );
}

console.log(`✅ Created ${children.length} children`);

// Link children to users
console.log("Creating user-children relationships...");
const userChildren = [
  { user_id: 2, child_id: 1, relationship: 'parent' }, // Sarah Johnson - Emma
  { user_id: 2, child_id: 2, relationship: 'parent' }, // Sarah Johnson - Noah
  { user_id: 3, child_id: 3, relationship: 'parent' }, // Mike Davis - Olivia
  { user_id: 3, child_id: 4, relationship: 'parent' }, // Mike Davis - Liam
  { user_id: 4, child_id: 5, relationship: 'parent' }, // Emily Parker - Sophia
  { user_id: 4, child_id: 6, relationship: 'parent' }, // Emily Parker - Mason
  { user_id: 4, child_id: 7, relationship: 'parent' }, // Emily Parker - Ava
];

const insertUserChild = db.prepare(`
  INSERT INTO user_children (user_id, child_id, relationship)
  VALUES (?, ?, ?)
`);

for (const uc of userChildren) {
  insertUserChild.run(uc.user_id, uc.child_id, uc.relationship);
}

console.log(`✅ Created ${userChildren.length} user-children relationships`);

// Create events
console.log("Creating events...");
const events = [
  // NOVEMBER 2025 EVENTS
  {
    title: "Fall Harvest Festival",
    description: "Celebrate the harvest season with games, crafts, and seasonal treats! Bring your family for an afternoon of autumn fun.",
    creator_id: 2,
    status: "published",
    category: "Social",
    start_date: "2025-11-02 14:00:00",
    end_date: "2025-11-02 17:00:00",
    location_name: "Community Park",
    location_address: "123 Park Ave, City, State 12345",
    max_attendees: 60,
    cost: "Free",
    age_range_type: "age",
    age_min: 4,
    age_max: 12,
    registration_deadline: "2025-10-30 23:59:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Science Lab: Chemistry Basics",
    description: "Hands-on chemistry experiments for curious minds! Learn about reactions, states of matter, and more.",
    creator_id: 4,
    status: "published",
    category: "Educational",
    start_date: "2025-11-05 10:00:00",
    end_date: "2025-11-05 12:00:00",
    location_name: "Science Center",
    location_address: "456 Science Blvd, City, State 12345",
    cost: "$10",
    age_range_type: "grade",
    grade_min: "4",
    grade_max: "8",
    registration_deadline: "2025-11-01 17:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Art Workshop: Watercolor Painting",
    description: "Learn watercolor techniques with local artist. All supplies provided!",
    creator_id: 2,
    status: "published",
    category: "Arts & Crafts",
    start_date: "2025-11-07 13:00:00",
    end_date: "2025-11-07 15:00:00",
    location_name: "Art Studio Downtown",
    location_address: "789 Art Street, City, State 12345",
    max_attendees: 15,
    cost: "$15",
    age_range_type: "age",
    age_min: 8,
    age_max: 14,
    registration_deadline: "2025-11-04 18:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Nature Hike & Bird Watching",
    description: "Explore local trails and learn to identify birds. Bring binoculars if you have them!",
    creator_id: 2,
    status: "published",
    category: "Field Trip",
    start_date: "2025-11-09 09:00:00",
    end_date: "2025-11-09 12:00:00",
    location_name: "Greenwood Trails",
    location_address: "Greenwood Park Entrance, City, State 12345",
    cost: "Free",
    age_range_type: "age",
    age_min: 6,
    age_max: 16,
    registration_deadline: "2025-11-06 20:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Weekly Book Club: Fantasy Fiction",
    description: "This week we discuss 'The Hobbit'. Come share your thoughts and enjoy hot cocoa!",
    creator_id: 2,
    status: "published",
    category: "Educational",
    start_date: "2025-11-12 16:00:00",
    end_date: "2025-11-12 17:30:00",
    location_name: "Public Library",
    location_address: "321 Book Lane, City, State 12345",
    cost: "Free",
    age_range_type: "grade",
    grade_min: "5",
    grade_max: "8",
    registration_deadline: "2025-11-10 17:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Soccer Practice & Scrimmage",
    description: "Weekly soccer practice for all skill levels. Bring water and shin guards!",
    creator_id: 4,
    status: "published",
    category: "Sports & Recreation",
    start_date: "2025-11-14 15:00:00",
    end_date: "2025-11-14 17:00:00",
    location_name: "Athletic Fields",
    location_address: "Sports Complex, City, State 12345",
    cost: "$5",
    age_range_type: "age",
    age_min: 7,
    age_max: 13,
    registration_deadline: "2025-11-12 18:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Thanksgiving Craft Day",
    description: "Make Thanksgiving decorations and cards. Perfect activity before the holiday!",
    creator_id: 2,
    status: "published",
    category: "Arts & Crafts",
    start_date: "2025-11-16 10:00:00",
    end_date: "2025-11-16 12:00:00",
    location_name: "Community Center",
    location_address: "456 Main St, City, State 12345",
    max_attendees: 25,
    cost: "Free",
    age_range_type: "age",
    age_min: 5,
    age_max: 11,
    registration_deadline: "2025-11-13 23:59:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Math Enrichment: Problem Solving",
    description: "Fun math challenges and puzzles to develop critical thinking skills.",
    creator_id: 4,
    status: "published",
    category: "Enrichment",
    start_date: "2025-11-19 14:00:00",
    end_date: "2025-11-19 16:00:00",
    location_name: "Learning Center",
    location_address: "234 Education Way, City, State 12345",
    cost: "$8",
    age_range_type: "grade",
    grade_min: "3",
    grade_max: "6",
    registration_deadline: "2025-11-15 17:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Community Service: Food Bank",
    description: "Help sort and pack food donations for families in need. Great service opportunity!",
    creator_id: 2,
    status: "published",
    category: "Volunteer",
    start_date: "2025-11-21 09:00:00",
    end_date: "2025-11-21 12:00:00",
    location_name: "City Food Bank",
    location_address: "567 Charity Road, City, State 12345",
    cost: "Free",
    age_range_type: "age",
    age_min: 10,
    age_max: 18,
    registration_deadline: "2025-11-18 20:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Movie Afternoon: Classic Films",
    description: "Watch age-appropriate classic films together. Popcorn provided!",
    creator_id: 2,
    status: "published",
    category: "Social",
    start_date: "2025-11-23 13:00:00",
    end_date: "2025-11-23 16:00:00",
    location_name: "Johnson Residence",
    location_address: "789 Oak Lane, City, State 12345",
    max_attendees: 20,
    cost: "Free",
    age_range_type: "age",
    age_min: 7,
    age_max: 14,
    registration_deadline: "2025-11-20 18:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "LEGO Robotics Workshop",
    description: "Build and program LEGO robots! Introduction to coding and engineering.",
    creator_id: 4,
    status: "published",
    category: "Enrichment",
    start_date: "2025-11-26 10:00:00",
    end_date: "2025-11-26 13:00:00",
    location_name: "Tech Lab",
    location_address: "123 Innovation Drive, City, State 12345",
    max_attendees: 12,
    cost: "$20",
    age_range_type: "grade",
    grade_min: "4",
    grade_max: "8",
    registration_deadline: "2025-11-22 17:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Thanksgiving Potluck",
    description: "Join us for a community Thanksgiving celebration! Bring a dish to share.",
    creator_id: 2,
    status: "published",
    category: "Social",
    start_date: "2025-11-28 12:00:00",
    end_date: "2025-11-28 15:00:00",
    location_name: "Community Hall",
    location_address: "456 Main St, City, State 12345",
    cost: "Free",
    age_range_type: "age",
    age_min: 0,
    age_max: 18,
    registration_deadline: "2025-11-25 23:59:00",
    custom_fields: JSON.stringify([
      { label: "What to Bring", value: "A dish to serve 6-8 people" },
      { label: "Dietary Restrictions", value: "Please note if your dish is vegetarian, gluten-free, etc." }
    ]),
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Basketball Skills Clinic",
    description: "Learn dribbling, shooting, and defensive techniques from experienced coaches.",
    creator_id: 4,
    status: "published",
    category: "Sports & Recreation",
    start_date: "2025-11-30 14:00:00",
    end_date: "2025-11-30 16:00:00",
    location_name: "Community Gym",
    location_address: "890 Sports Avenue, City, State 12345",
    max_attendees: 20,
    cost: "$10",
    age_range_type: "age",
    age_min: 8,
    age_max: 14,
    registration_deadline: "2025-11-27 18:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },

  // DECEMBER 2025 EVENTS
  {
    title: "Holiday Cookie Decorating",
    description: "Decorate festive cookies and take them home! All decorating supplies provided.",
    creator_id: 2,
    status: "published",
    category: "Arts & Crafts",
    start_date: "2025-12-03 13:00:00",
    end_date: "2025-12-03 15:00:00",
    location_name: "Community Kitchen",
    location_address: "456 Main St, City, State 12345",
    max_attendees: 30,
    cost: "$5",
    age_range_type: "age",
    age_min: 4,
    age_max: 12,
    registration_deadline: "2025-11-30 23:59:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Winter Science: Snow & Ice",
    description: "Explore the science of winter weather through experiments and demonstrations.",
    creator_id: 4,
    status: "published",
    category: "Educational",
    start_date: "2025-12-05 10:00:00",
    end_date: "2025-12-05 12:00:00",
    location_name: "Science Center",
    location_address: "456 Science Blvd, City, State 12345",
    cost: "$8",
    age_range_type: "grade",
    grade_min: "2",
    grade_max: "6",
    registration_deadline: "2025-12-02 17:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Holiday Caroling & Hot Cocoa",
    description: "Sing festive songs around the neighborhood, then enjoy hot cocoa together!",
    creator_id: 2,
    status: "published",
    category: "Social",
    start_date: "2025-12-07 16:00:00",
    end_date: "2025-12-07 18:00:00",
    location_name: "Town Square",
    location_address: "Center of Downtown, City, State 12345",
    cost: "Free",
    age_range_type: "age",
    age_min: 5,
    age_max: 16,
    registration_deadline: "2025-12-05 18:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Museum Field Trip: History Exhibit",
    description: "Explore local history at the museum. Guided tour included!",
    creator_id: 4,
    status: "published",
    category: "Field Trip",
    start_date: "2025-12-10 10:00:00",
    end_date: "2025-12-10 13:00:00",
    location_name: "City Museum",
    location_address: "789 History Lane, City, State 12345",
    max_attendees: 25,
    cost: "$12",
    age_range_type: "grade",
    grade_min: "3",
    grade_max: "8",
    registration_deadline: "2025-12-06 17:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Chess Club Meeting",
    description: "Learn chess strategies and play against other students. All skill levels welcome!",
    creator_id: 2,
    status: "published",
    category: "Enrichment",
    start_date: "2025-12-12 15:00:00",
    end_date: "2025-12-12 17:00:00",
    location_name: "Library Meeting Room",
    location_address: "321 Book Lane, City, State 12345",
    cost: "Free",
    age_range_type: "age",
    age_min: 7,
    age_max: 15,
    registration_deadline: "2025-12-10 18:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Holiday Craft Fair",
    description: "Make handmade gifts and decorations. Perfect for holiday giving!",
    creator_id: 2,
    status: "published",
    category: "Arts & Crafts",
    start_date: "2025-12-14 10:00:00",
    end_date: "2025-12-14 13:00:00",
    location_name: "Community Center",
    location_address: "456 Main St, City, State 12345",
    max_attendees: 35,
    cost: "$10",
    age_range_type: "age",
    age_min: 6,
    age_max: 14,
    registration_deadline: "2025-12-11 23:59:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Ice Skating Party",
    description: "Hit the ice rink for an afternoon of skating and fun! Skate rental included.",
    creator_id: 4,
    status: "published",
    category: "Sports & Recreation",
    start_date: "2025-12-17 14:00:00",
    end_date: "2025-12-17 16:30:00",
    location_name: "City Ice Rink",
    location_address: "555 Winter Way, City, State 12345",
    max_attendees: 40,
    cost: "$15",
    age_range_type: "age",
    age_min: 6,
    age_max: 16,
    registration_deadline: "2025-12-13 18:00:00",
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "Reading Challenge Celebration",
    description: "Celebrate students who completed the fall reading challenge! Awards and treats.",
    creator_id: 2,
    status: "published",
    category: "Educational",
    start_date: "2025-12-19 16:00:00",
    end_date: "2025-12-19 18:00:00",
    location_name: "Public Library",
    location_address: "321 Book Lane, City, State 12345",
    cost: "Free",
    age_range_type: "grade",
    grade_min: "K",
    grade_max: "8",
    registration_deadline: "2025-12-16 17:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Holiday Movie Marathon",
    description: "Watch classic holiday movies together. Bring pillows and blankets!",
    creator_id: 2,
    status: "published",
    category: "Social",
    start_date: "2025-12-21 12:00:00",
    end_date: "2025-12-21 17:00:00",
    location_name: "Johnson Residence",
    location_address: "789 Oak Lane, City, State 12345",
    max_attendees: 20,
    cost: "Free",
    age_range_type: "age",
    age_min: 5,
    age_max: 14,
    registration_deadline: "2025-12-18 20:00:00",
    approved_by: 1,
    approved_at: new Date().toISOString()
  },
  {
    title: "Toy Drive Collection Day",
    description: "Bring new unwrapped toys for children in need. Community service hours available.",
    creator_id: 4,
    status: "published",
    category: "Volunteer",
    start_date: "2025-12-23 10:00:00",
    end_date: "2025-12-23 14:00:00",
    location_name: "Community Center",
    location_address: "456 Main St, City, State 12345",
    cost: "Free",
    age_range_type: "age",
    age_min: 8,
    age_max: 18,
    registration_deadline: "2025-12-20 23:59:00",
    custom_fields: JSON.stringify([
      { label: "What to Bring", value: "New, unwrapped toy suitable for ages 0-12" }
    ]),
    approved_by: 4,
    approved_at: new Date().toISOString()
  },
  {
    title: "New Year's Eve Party (Daytime)",
    description: "Ring in the New Year at noon! Games, crafts, and countdown celebration.",
    creator_id: 2,
    status: "published",
    category: "Social",
    start_date: "2025-12-31 10:00:00",
    end_date: "2025-12-31 13:00:00",
    location_name: "Community Hall",
    location_address: "456 Main St, City, State 12345",
    max_attendees: 50,
    cost: "$5",
    age_range_type: "age",
    age_min: 4,
    age_max: 12,
    registration_deadline: "2025-12-28 23:59:00",
    custom_fields: JSON.stringify([
      { label: "What to Bring", value: "Party hat or noisemaker (optional)" }
    ]),
    approved_by: 1,
    approved_at: new Date().toISOString()
  }
];

const insertEvent = db.prepare(`
  INSERT INTO events (
    title, description, creator_id, status, category, start_date, end_date,
    location_name, location_address, max_attendees, cost, age_range_type,
    age_min, age_max, grade_min, grade_max, registration_deadline, custom_fields,
    approved_by, approved_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const event of events) {
  insertEvent.run(
    event.title,
    event.description,
    event.creator_id,
    event.status,
    event.category,
    event.start_date,
    event.end_date,
    event.location_name,
    event.location_address,
    event.max_attendees || null,
    event.cost,
    event.age_range_type,
    event.age_range_type === 'age' ? event.age_min : null,
    event.age_range_type === 'age' ? event.age_max : null,
    event.age_range_type === 'grade' ? event.grade_min : null,
    event.age_range_type === 'grade' ? event.grade_max : null,
    event.registration_deadline,
    event.custom_fields || null,
    event.approved_by || null,
    event.approved_at || null
  );
}

console.log(`✅ Created ${events.length} events`);

// Create a form for the Summer Picnic
console.log("Creating forms...");
const formResult = db.prepare(`
  INSERT INTO forms (event_id, creator_id, form_type, is_active)
  VALUES (?, ?, ?, ?)
`).run(1, 2, "signup", 1);

const formId = formResult.lastInsertRowid;

// Add form fields
const formFields = [
  { label: "Parent Name(s)", type: "text", required: 1, field_order: 1 },
  { label: "Children's Ages", type: "text", required: 1, field_order: 2, placeholder: "e.g., 7, 9, 11" },
  { label: "Allergies/Dietary Restrictions", type: "textarea", required: 0, field_order: 3 },
  { label: "What will you bring?", type: "text", required: 0, field_order: 4, placeholder: "Dish or activity" }
];

const insertField = db.prepare(`
  INSERT INTO form_fields (form_id, field_order, label, type, required, placeholder)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const field of formFields) {
  insertField.run(
    formId,
    field.field_order,
    field.label,
    field.type,
    field.required,
    field.placeholder || null
  );
}

console.log(`✅ Created form with ${formFields.length} fields`);

// Create RSVPs
console.log("Creating RSVPs...");
const rsvps = [
  { event_id: 1, user_id: 3, status: "going" },
  { event_id: 1, user_id: 4, status: "going" },
  { event_id: 2, user_id: 2, status: "maybe" }
];

const insertRSVP = db.prepare(`
  INSERT INTO rsvps (event_id, user_id, status)
  VALUES (?, ?, ?)
`);

for (const rsvp of rsvps) {
  insertRSVP.run(rsvp.event_id, rsvp.user_id, rsvp.status);
}

// Update attendee counts
db.run(`UPDATE events SET current_attendees = 2 WHERE id = 1`);
db.run(`UPDATE events SET current_attendees = 0 WHERE id = 2`);

console.log(`✅ Created ${rsvps.length} RSVPs`);

// Create comments
console.log("Creating comments...");
const comments = [
  {
    event_id: 1,
    user_id: 3,
    content: "Is this suitable for ages 5+?"
  },
  {
    event_id: 1,
    user_id: 2,
    content: "Absolutely! Perfect for 5-12 year olds. We'll have age-appropriate activities for everyone.",
    parent_comment_id: 1
  },
  {
    event_id: 1,
    user_id: 4,
    content: "Looking forward to this event! 🎉"
  }
];

const insertComment = db.prepare(`
  INSERT INTO comments (event_id, user_id, content, parent_comment_id)
  VALUES (?, ?, ?, ?)
`);

for (const comment of comments) {
  insertComment.run(
    comment.event_id,
    comment.user_id,
    comment.content,
    comment.parent_comment_id || null
  );
}

console.log(`✅ Created ${comments.length} comments`);

// Create initial contract/TOS
console.log("Creating initial contract...");
const initialContract = {
  version: 1,
  title: "Homeschool Group Terms of Service v1.0",
  content: `HOMESCHOOL GROUP TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By using this homeschool group platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this service.

2. EVENT PARTICIPATION
- All participants must RSVP for events through the platform
- Parents/guardians are responsible for their children's behavior at all events
- Event organizers reserve the right to cancel events due to weather, low attendance, or other circumstances
- Participants must respect age/grade requirements for events

3. PRIVACY & INFORMATION SHARING
- Contact information shared on this platform is for coordination purposes only
- Do not share other members' information outside the group without permission
- Photos taken at events may be shared within the group

4. CODE OF CONDUCT
- Treat all members with respect and kindness
- Communicate professionally and constructively
- Report any concerns to group administrators
- Harassment, discrimination, or inappropriate behavior will not be tolerated

5. HEALTH & SAFETY
- Notify organizers of any allergies or medical conditions
- Follow all safety guidelines at events
- Do not attend events if you or your children are sick
- Parents/guardians are responsible for supervising their children

6. LIABILITY
- Participation in events is at your own risk
- The group and event organizers are not liable for injuries, accidents, or damages
- Participants should carry appropriate insurance

7. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.

8. TERMINATION
We reserve the right to terminate access for violations of these terms or inappropriate behavior.

By clicking "Accept," you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`,
  created_by: 1, // Admin user
  is_active: 1
};

db.prepare(`
  INSERT INTO contracts (version, title, content, created_by, is_active)
  VALUES (?, ?, ?, ?, ?)
`).run(
  initialContract.version,
  initialContract.title,
  initialContract.content,
  initialContract.created_by,
  initialContract.is_active
);

console.log("✅ Created initial contract");

console.log("\n🎉 Database seeded successfully!");
console.log("\n📋 Login credentials:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Super Admin:");
console.log("  Email: admin@homeschool.com");
console.log("  Password: admin123");
console.log("\nEvent Creator (Sarah Johnson):");
console.log("  Email: sarah.johnson@email.com");
console.log("  Password: password123");
console.log("\nRegular User (Mike Davis):");
console.log("  Email: mike.davis@email.com");
console.log("  Password: password123");
console.log("\nAdmin (Emily Parker):");
console.log("  Email: emily.parker@email.com");
console.log("  Password: password123");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
