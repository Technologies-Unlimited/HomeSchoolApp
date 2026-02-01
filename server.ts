import { getDB } from "./src/db/index.ts";
import { createToken, verifyToken, extractToken } from "./src/utils/jwt.ts";
import bcrypt from "bcryptjs";
import type { DBUser, DBEvent, DBComment, DBRSVP } from "./src/db/index.ts";
import { calculateNotificationDate, sendEmail, generateNewEventEmail, generateVerificationEmail } from "./src/services/notifications.ts";
import { uploadFile, deleteFile, getFileStream, fileExists } from "./src/services/storage.ts";

const PORT = process.env.PORT || 3000;
const db = getDB();

// Helper to get user from token
function getUserFromRequest(request: Request): DBUser | null {
  const token = extractToken(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = db.query<DBUser, [number]>(
    "SELECT * FROM users WHERE id = ? AND is_active = 1"
  ).get(payload.userId);

  return user || null;
}

// Helper to send JSON response
function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Helper to schedule notifications for an RSVP
function scheduleNotificationsForRSVP(userId: number, eventId: number, rsvpId: number) {
  try {
    // Get user's notification preferences
    const preferences = db.query(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `).get(userId) as any;

    if (!preferences || !preferences.email_enabled) {
      return; // User has no preferences or email disabled
    }

    // Get event details
    const event = db.query(`
      SELECT start_date FROM events WHERE id = ?
    `).get(eventId) as any;

    if (!event) return;

    const eventDate = new Date(event.start_date);

    // Clear existing notifications for this RSVP
    db.prepare(`
      DELETE FROM notification_queue WHERE rsvp_id = ?
    `).run(rsvpId);

    // Schedule notifications based on preferences
    const notificationTypes = [];
    if (preferences.reminder_1day) notificationTypes.push('1day');
    if (preferences.reminder_1week) notificationTypes.push('1week');
    if (preferences.reminder_2weeks) notificationTypes.push('2weeks');
    if (preferences.reminder_1month) notificationTypes.push('1month');
    if (preferences.reminder_custom_days) notificationTypes.push('custom');

    for (const type of notificationTypes) {
      const scheduledDate = calculateNotificationDate(
        eventDate,
        type,
        preferences.reminder_custom_days
      );

      // Only schedule if the notification date is in the future
      if (scheduledDate > new Date()) {
        db.prepare(`
          INSERT INTO notification_queue (
            user_id, event_id, rsvp_id, notification_type, scheduled_for
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          userId,
          eventId,
          rsvpId,
          type,
          scheduledDate.toISOString()
        );
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

// Helper to send new event notifications
async function sendNewEventNotifications(eventId: number) {
  try {
    // Get event details
    const event = db.query(`
      SELECT e.*, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM events e
      JOIN users u ON e.creator_id = u.id
      WHERE e.id = ?
    `).get(eventId) as any;

    if (!event) return;

    // Get all users who have new event notifications enabled
    const users = db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      WHERE u.is_active = 1
        AND (np.email_enabled = 1 OR np.email_enabled IS NULL)
        AND (np.new_event_notifications = 1 OR np.new_event_notifications IS NULL)
    `).all() as any[];

    if (users.length === 0) return;

    // Format event data
    const eventDate = new Date(event.start_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const location = event.location_name || 'TBD';
    const category = event.category || 'General';
    const cost = event.cost || 'Free';

    let ageRange = '';
    if (event.age_range_type === 'age') {
      ageRange = `Ages ${event.age_min}-${event.age_max}`;
    } else if (event.age_range_type === 'grade') {
      ageRange = `Grades ${event.grade_min}-${event.grade_max}`;
    }

    // Send emails in the background (don't await to avoid blocking)
    for (const user of users) {
      const emailData = generateNewEventEmail(
        user.first_name,
        event.title,
        event.description || 'No description provided.',
        formattedDate,
        location,
        category,
        cost,
        ageRange
      );

      emailData.to = user.email;

      // Send email (async, non-blocking)
      sendEmail(emailData).catch(error => {
        console.error(`Failed to send new event email to ${user.email}:`, error);
      });
    }

    console.log(`📧 Sent new event notifications to ${users.length} users for event: ${event.title}`);
  } catch (error) {
    console.error('Error sending new event notifications:', error);
  }
}

// Helper to format user for public display (name only)
function formatUserPublic(user: DBUser) {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`
  };
}

// Helper to format user for private/authenticated views
function formatUserPrivate(user: DBUser) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    createdAt: user.created_at
  };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // ===== AUTHENTICATION ROUTES =====

    if (path === "/api/auth/register" && method === "POST") {
      try {
        const body = await req.json();
        const { email, phone, password, firstName, lastName, accountType } = body;

        // Validation
        if (!email || !phone || !password || !firstName || !lastName || !accountType) {
          return jsonResponse({ error: "All fields are required" }, 400);
        }

        if (password.length < 8) {
          return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
        }

        if (accountType !== 'parent' && accountType !== 'student') {
          return jsonResponse({ error: "Account type must be 'parent' or 'student'" }, 400);
        }

        // Check if user exists
        const existing = db.query("SELECT id FROM users WHERE email = ?").get(email);
        if (existing) {
          return jsonResponse({ error: "Email already registered" }, 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with email_verified = 0
        const result = db.prepare(`
          INSERT INTO users (email, phone, password_hash, first_name, last_name, role, email_verified, account_type)
          VALUES (?, ?, ?, ?, ?, 'user', 0, ?)
        `).run(email, phone, passwordHash, firstName, lastName, accountType);

        const userId = result.lastInsertRowid as number;

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store verification code (expires in 24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        db.prepare(`
          INSERT INTO email_verification_codes (email, code, expires_at)
          VALUES (?, ?, ?)
        `).run(email, verificationCode, expiresAt.toISOString());

        // Send verification email
        const verificationEmailData = generateVerificationEmail(firstName, verificationCode);
        verificationEmailData.to = email;
        await sendEmail(verificationEmailData);

        // Create token
        const token = createToken({ userId, email, role: 'user' });

        const user = db.query<DBUser, [number]>("SELECT * FROM users WHERE id = ?").get(userId);

        return jsonResponse({
          token,
          user: formatUserPrivate(user!),
          requiresVerification: true
        }, 201);
      } catch (error) {
        console.error("Register error:", error);
        return jsonResponse({ error: "Registration failed" }, 500);
      }
    }

    if (path === "/api/auth/send-verification" && method === "POST") {
      try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
          return jsonResponse({ error: "Email is required" }, 400);
        }

        // Check if user exists
        const user = db.query("SELECT * FROM users WHERE email = ?").get(email) as any;
        if (!user) {
          return jsonResponse({ error: "User not found" }, 404);
        }

        // Check if already verified
        if (user.email_verified) {
          return jsonResponse({ error: "Email already verified" }, 400);
        }

        // Generate new 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete old codes for this email
        db.prepare(`
          DELETE FROM email_verification_codes WHERE email = ?
        `).run(email);

        // Store new verification code (expires in 24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        db.prepare(`
          INSERT INTO email_verification_codes (email, code, expires_at)
          VALUES (?, ?, ?)
        `).run(email, verificationCode, expiresAt.toISOString());

        // Send verification email
        const verificationEmailData = generateVerificationEmail(user.first_name, verificationCode);
        verificationEmailData.to = email;
        await sendEmail(verificationEmailData);

        return jsonResponse({
          message: "Verification code sent successfully"
        });
      } catch (error) {
        console.error("Send verification error:", error);
        return jsonResponse({ error: "Failed to send verification code" }, 500);
      }
    }

    if (path === "/api/auth/verify-email" && method === "POST") {
      try {
        const body = await req.json();
        const { email, code } = body;

        if (!email || !code) {
          return jsonResponse({ error: "Email and code are required" }, 400);
        }

        // Find valid verification code
        const verification = db.query(`
          SELECT * FROM email_verification_codes
          WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
          ORDER BY created_at DESC
          LIMIT 1
        `).get(email, code) as any;

        if (!verification) {
          return jsonResponse({ error: "Invalid or expired verification code" }, 400);
        }

        // Mark code as used
        db.prepare(`
          UPDATE email_verification_codes
          SET used = 1
          WHERE id = ?
        `).run(verification.id);

        // Mark user as verified
        db.prepare(`
          UPDATE users
          SET email_verified = 1
          WHERE email = ?
        `).run(email);

        return jsonResponse({
          message: "Email verified successfully"
        });
      } catch (error) {
        console.error("Verify email error:", error);
        return jsonResponse({ error: "Email verification failed" }, 500);
      }
    }

    if (path === "/api/auth/login" && method === "POST") {
      try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
          return jsonResponse({ error: "Email and password required" }, 400);
        }

        const user = db.query<DBUser, [string]>(
          "SELECT * FROM users WHERE email = ? AND is_active = 1"
        ).get(email);

        if (!user) {
          return jsonResponse({ error: "Invalid credentials" }, 401);
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          return jsonResponse({ error: "Invalid credentials" }, 401);
        }

        // Update last login
        db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

        const token = createToken({
          userId: user.id,
          email: user.email,
          role: user.role
        });

        return jsonResponse({
          token,
          user: formatUserPrivate(user)
        });
      } catch (error) {
        console.error("Login error:", error);
        return jsonResponse({ error: "Login failed" }, 500);
      }
    }

    if (path === "/api/auth/me" && method === "GET") {
      const user = getUserFromRequest(req);
      if (!user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      return jsonResponse({ user: formatUserPrivate(user) });
    }

    // ===== EVENTS ROUTES =====

    if (path === "/api/events" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        let query = `
          SELECT e.*, u.first_name, u.last_name
          FROM events e
          JOIN users u ON e.creator_id = u.id
        `;

        // Filter based on user permissions
        if (!user || user.role === 'user') {
          // Regular users only see published events
          query += " WHERE e.status = 'published'";
        } else if (user.role === 'event_creator') {
          // Event creators see published events and their own drafts/pending
          query += ` WHERE e.status = 'published' OR e.creator_id = ${user.id}`;
        }
        // Admins and super_admins see everything (no WHERE clause)

        query += " ORDER BY e.start_date ASC";

        const events = db.query(query).all() as any[];

        const formattedEvents = events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          status: event.status,
          category: event.category,
          startDate: event.start_date,
          endDate: event.end_date,
          location: {
            name: event.location_name,
            address: event.location_address
          },
          maxAttendees: event.max_attendees,
          currentAttendees: event.current_attendees,
          cost: event.cost,
          ageRangeType: event.age_range_type,
          ageMin: event.age_min,
          ageMax: event.age_max,
          gradeMin: event.grade_min,
          gradeMax: event.grade_max,
          registrationDeadline: event.registration_deadline,
          customFields: event.custom_fields ? JSON.parse(event.custom_fields) : null,
          attachment: event.attachment_filename ? {
            filename: event.attachment_filename,
            path: event.attachment_path
          } : null,
          imageUrl: event.image_url,
          creator: {
            id: event.creator_id,
            name: `${event.first_name} ${event.last_name}`
          },
          createdAt: event.created_at
        }));

        return jsonResponse({ events: formattedEvents });
      } catch (error) {
        console.error("Get events error:", error);
        return jsonResponse({ error: "Failed to fetch events" }, 500);
      }
    }

    if (path.match(/^\/api\/events\/\d+$/) && method === "GET") {
      try {
        const eventId = parseInt(path.split("/")[3]);

        const event = db.query(`
          SELECT e.*, u.first_name, u.last_name
          FROM events e
          JOIN users u ON e.creator_id = u.id
          WHERE e.id = ?
        `).get(eventId) as any;

        if (!event) {
          return jsonResponse({ error: "Event not found" }, 404);
        }

        // Check permissions
        const user = getUserFromRequest(req);
        if (event.status !== 'published') {
          if (!user) {
            return jsonResponse({ error: "Unauthorized" }, 401);
          }
          if (user.role === 'user' || (user.role === 'event_creator' && user.id !== event.creator_id)) {
            return jsonResponse({ error: "Forbidden" }, 403);
          }
        }

        return jsonResponse({
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            status: event.status,
            category: event.category,
            startDate: event.start_date,
            endDate: event.end_date,
            location: {
              name: event.location_name,
              address: event.location_address
            },
            maxAttendees: event.max_attendees,
            currentAttendees: event.current_attendees,
            cost: event.cost,
            ageRangeType: event.age_range_type,
            ageMin: event.age_min,
            ageMax: event.age_max,
            gradeMin: event.grade_min,
            gradeMax: event.grade_max,
            registrationDeadline: event.registration_deadline,
            customFields: event.custom_fields ? JSON.parse(event.custom_fields) : null,
            attachment: event.attachment_filename ? {
              filename: event.attachment_filename,
              path: event.attachment_path
            } : null,
            imageUrl: event.image_url,
            creator: {
              id: event.creator_id,
              name: `${event.first_name} ${event.last_name}`
            },
            createdAt: event.created_at
          }
        });
      } catch (error) {
        console.error("Get event error:", error);
        return jsonResponse({ error: "Failed to fetch event" }, 500);
      }
    }

    if (path === "/api/events" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        if (user.role === 'user') {
          return jsonResponse({ error: "Forbidden - insufficient permissions" }, 403);
        }

        const body = await req.json();
        const {
          title, description, category, startDate, endDate, locationName, locationAddress, maxAttendees,
          cost, ageRangeType, ageMin, ageMax, gradeMin, gradeMax, registrationDeadline, customFields,
          attachmentFilename, attachmentPath
        } = body;

        // Validate required fields
        if (!title || !startDate) {
          return jsonResponse({ error: "Title and start date are required" }, 400);
        }

        if (!registrationDeadline) {
          return jsonResponse({ error: "Registration deadline is required" }, 400);
        }

        if (!ageRangeType || (ageRangeType !== 'age' && ageRangeType !== 'grade')) {
          return jsonResponse({ error: "Age range type must be 'age' or 'grade'" }, 400);
        }

        if (ageRangeType === 'age' && (!ageMin || !ageMax)) {
          return jsonResponse({ error: "Age range requires min and max age" }, 400);
        }

        if (ageRangeType === 'grade' && (!gradeMin || !gradeMax)) {
          return jsonResponse({ error: "Grade range requires min and max grade" }, 400);
        }

        // Determine initial status based on role
        let status = 'pending';
        let approvedBy = null;
        let approvedAt = null;

        if (user.role === 'admin' || user.role === 'super_admin') {
          status = 'published';
          approvedBy = user.id;
          approvedAt = new Date().toISOString();
        }

        const result = db.prepare(`
          INSERT INTO events (
            title, description, creator_id, status, category, start_date, end_date,
            location_name, location_address, max_attendees, cost, age_range_type,
            age_min, age_max, grade_min, grade_max, registration_deadline, custom_fields,
            attachment_filename, attachment_path, approved_by, approved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          title,
          description || null,
          user.id,
          status,
          category || null,
          startDate,
          endDate || null,
          locationName || null,
          locationAddress || null,
          maxAttendees || null,
          cost || 'Free',
          ageRangeType,
          ageRangeType === 'age' ? ageMin : null,
          ageRangeType === 'age' ? ageMax : null,
          ageRangeType === 'grade' ? gradeMin : null,
          ageRangeType === 'grade' ? gradeMax : null,
          registrationDeadline,
          customFields ? JSON.stringify(customFields) : null,
          attachmentFilename || null,
          attachmentPath || null,
          approvedBy,
          approvedAt
        );

        const eventId = result.lastInsertRowid;

        // Send new event notifications if the event is published
        if (status === 'published') {
          sendNewEventNotifications(eventId as number);
        }

        return jsonResponse({ message: "Event created", eventId, status }, 201);
      } catch (error) {
        console.error("Create event error:", error);
        return jsonResponse({ error: "Failed to create event" }, 500);
      }
    }

    // ===== FILE UPLOAD ROUTES =====

    if (path === "/api/events/upload" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        if (user.role === 'user') {
          return jsonResponse({ error: "Forbidden - insufficient permissions" }, 403);
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
          return jsonResponse({ error: "No file provided" }, 400);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${safeName}`;
        const filePath = `./uploads/${filename}`;

        // Save file
        await Bun.write(filePath, await file.arrayBuffer());

        return jsonResponse({
          success: true,
          filename: file.name,
          path: `/uploads/${filename}`
        }, 201);
      } catch (error) {
        console.error("File upload error:", error);
        return jsonResponse({ error: "File upload failed" }, 500);
      }
    }

    // ===== ADMIN ROUTES =====

    if (path === "/api/admin/users" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          return jsonResponse({ error: "Forbidden - admin access required" }, 403);
        }

        const users = db.query(`
          SELECT id, email, phone, first_name, last_name, role, is_active, created_at, last_login
          FROM users
          ORDER BY created_at DESC
        `).all() as any[];

        const formattedUsers = users.map(u => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          isActive: u.is_active,
          createdAt: u.created_at,
          lastLogin: u.last_login
        }));

        return jsonResponse({ users: formattedUsers });
      } catch (error) {
        console.error("Get users error:", error);
        return jsonResponse({ error: "Failed to fetch users" }, 500);
      }
    }

    if (path.match(/^\/api\/admin\/users\/\d+$/) && method === "PATCH") {
      try {
        const user = getUserFromRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          return jsonResponse({ error: "Forbidden - admin access required" }, 403);
        }

        const userId = parseInt(path.split("/")[4]);
        const body = await req.json();
        const { firstName, lastName, email, phone, role } = body;

        // Only super_admin can set super_admin role
        if (role === 'super_admin' && user.role !== 'super_admin') {
          return jsonResponse({ error: "Only super admins can assign super admin role" }, 403);
        }

        // Check if email is already taken by another user
        const existingUser = db.query("SELECT id FROM users WHERE email = ? AND id != ?").get(email, userId);
        if (existingUser) {
          return jsonResponse({ error: "Email already in use by another user" }, 400);
        }

        db.prepare(`
          UPDATE users
          SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(firstName, lastName, email, phone, role, userId);

        return jsonResponse({ message: "User updated successfully" });
      } catch (error) {
        console.error("Update user error:", error);
        return jsonResponse({ error: "Failed to update user" }, 500);
      }
    }

    // ===== CONTRACT/TOS ROUTES =====

    if (path === "/api/contracts" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          return jsonResponse({ error: "Forbidden - admin access required" }, 403);
        }

        const contracts = db.query(`
          SELECT c.*, u.first_name as creator_first_name, u.last_name as creator_last_name
          FROM contracts c
          JOIN users u ON c.created_by = u.id
          ORDER BY c.version DESC
        `).all() as any[];

        const formattedContracts = contracts.map(c => ({
          id: c.id,
          version: c.version,
          title: c.title,
          content: c.content,
          filePath: c.file_path,
          isActive: c.is_active,
          createdBy: c.created_by,
          creatorName: `${c.creator_first_name} ${c.creator_last_name}`,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }));

        return jsonResponse({ contracts: formattedContracts });
      } catch (error) {
        console.error("Get contracts error:", error);
        return jsonResponse({ error: "Failed to fetch contracts" }, 500);
      }
    }

    if (path === "/api/contracts/active" && method === "GET") {
      try {
        const contract = db.query(`
          SELECT * FROM contracts
          WHERE is_active = 1
          ORDER BY version DESC
          LIMIT 1
        `).get() as any;

        if (!contract) {
          return jsonResponse({ contract: null });
        }

        return jsonResponse({
          contract: {
            id: contract.id,
            version: contract.version,
            title: contract.title,
            content: contract.content,
            filePath: contract.file_path,
            createdAt: contract.created_at
          }
        });
      } catch (error) {
        console.error("Get active contract error:", error);
        return jsonResponse({ error: "Failed to fetch active contract" }, 500);
      }
    }

    if (path === "/api/contracts" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          return jsonResponse({ error: "Forbidden - admin access required" }, 403);
        }

        const body = await req.json();
        const { title, content } = body;

        if (!title || !content) {
          return jsonResponse({ error: "Title and content are required" }, 400);
        }

        // Get the next version number
        const latestContract = db.query(`
          SELECT MAX(version) as max_version FROM contracts
        `).get() as any;

        const nextVersion = (latestContract?.max_version || 0) + 1;

        // Deactivate all existing contracts
        db.prepare(`UPDATE contracts SET is_active = 0`).run();

        // Create new contract
        const result = db.prepare(`
          INSERT INTO contracts (version, title, content, is_active, created_by)
          VALUES (?, ?, ?, 1, ?)
        `).run(nextVersion, title, content, user.id);

        const newContract = db.query(`
          SELECT * FROM contracts WHERE id = ?
        `).get(result.lastInsertRowid) as any;

        return jsonResponse({
          contract: {
            id: newContract.id,
            version: newContract.version,
            title: newContract.title,
            content: newContract.content,
            isActive: newContract.is_active,
            createdAt: newContract.created_at
          }
        }, 201);
      } catch (error) {
        console.error("Create contract error:", error);
        return jsonResponse({ error: "Failed to create contract" }, 500);
      }
    }

    if (path.match(/^\/api\/contracts\/\d+\/activate$/) && method === "PATCH") {
      try {
        const user = getUserFromRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          return jsonResponse({ error: "Forbidden - admin access required" }, 403);
        }

        const contractId = parseInt(path.split("/")[3]);

        // Deactivate all contracts
        db.prepare(`UPDATE contracts SET is_active = 0`).run();

        // Activate the specified contract
        db.prepare(`
          UPDATE contracts SET is_active = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(contractId);

        return jsonResponse({ message: "Contract activated successfully" });
      } catch (error) {
        console.error("Activate contract error:", error);
        return jsonResponse({ error: "Failed to activate contract" }, 500);
      }
    }

    if (path === "/api/contracts/accept" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { version } = body;

        if (!version) {
          return jsonResponse({ error: "Contract version is required" }, 400);
        }

        // Update user's TOS acceptance
        db.prepare(`
          UPDATE users
          SET tos_accepted_at = CURRENT_TIMESTAMP, tos_version = ?
          WHERE id = ?
        `).run(version, user.id);

        return jsonResponse({ message: "Contract accepted successfully" });
      } catch (error) {
        console.error("Accept contract error:", error);
        return jsonResponse({ error: "Failed to accept contract" }, 500);
      }
    }

    // ===== COMMENTS ROUTES =====

    if (path.match(/^\/api\/comments\/\d+$/) && method === "GET") {
      try {
        const eventId = parseInt(path.split("/")[3]);

        const comments = db.query(`
          SELECT c.*, u.first_name, u.last_name
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.event_id = ? AND c.is_deleted = 0
          ORDER BY c.created_at ASC
        `).all(eventId) as any[];

        const formattedComments = comments.map((comment: any) => ({
          id: comment.id,
          eventId: comment.event_id,
          userId: comment.user_id,
          userName: `${comment.first_name} ${comment.last_name}`,
          content: comment.content,
          parentCommentId: comment.parent_comment_id,
          likes: comment.likes,
          edited: comment.edited === 1,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at
        }));

        return jsonResponse({ comments: formattedComments });
      } catch (error) {
        console.error("Get comments error:", error);
        return jsonResponse({ error: "Failed to fetch comments" }, 500);
      }
    }

    if (path === "/api/comments" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { eventId, content, parentCommentId } = body;

        if (!eventId || !content) {
          return jsonResponse({ error: "Event ID and content required" }, 400);
        }

        // Check if event exists
        const event = db.query("SELECT id FROM events WHERE id = ?").get(eventId);
        if (!event) {
          return jsonResponse({ error: "Event not found" }, 404);
        }

        const result = db.prepare(`
          INSERT INTO comments (event_id, user_id, content, parent_comment_id)
          VALUES (?, ?, ?, ?)
        `).run(eventId, user.id, content, parentCommentId || null);

        const commentId = result.lastInsertRowid;

        return jsonResponse({
          message: "Comment created",
          commentId,
          userName: `${user.first_name} ${user.last_name}`
        }, 201);
      } catch (error) {
        console.error("Create comment error:", error);
        return jsonResponse({ error: "Failed to create comment" }, 500);
      }
    }

    // ===== EVENT DOCUMENTS ROUTES =====

    // Upload document to event
    if (path.match(/^\/api\/events\/\d+\/documents$/) && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const eventId = parseInt(path.split('/')[3]);

        // Check if event exists and user has permission
        const event = db.query<DBEvent, [number]>(
          "SELECT * FROM events WHERE id = ?"
        ).get(eventId);

        if (!event) {
          return jsonResponse({ error: "Event not found" }, 404);
        }

        // Only event creator or admins can upload documents
        if (event.created_by !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
          return jsonResponse({ error: "Forbidden - only event creator or admins can upload documents" }, 403);
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return jsonResponse({ error: "No file provided" }, 400);
        }

        // Upload file
        const uploadedFile = await uploadFile(file);

        // Save to database
        const result = db.prepare(`
          INSERT INTO event_documents (
            event_id, filename, original_filename, file_size, mime_type,
            storage_path, storage_type, uploaded_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          eventId,
          uploadedFile.filename,
          uploadedFile.originalFilename,
          uploadedFile.fileSize,
          uploadedFile.mimeType,
          uploadedFile.storagePath,
          uploadedFile.storageType,
          user.id
        );

        return jsonResponse({
          success: true,
          document: {
            id: result.lastInsertRowid,
            ...uploadedFile
          }
        }, 201);
      } catch (error) {
        console.error("Upload document error:", error);
        return jsonResponse({ error: "Failed to upload document" }, 500);
      }
    }

    // Get documents for an event
    if (path.match(/^\/api\/events\/\d+\/documents$/) && method === "GET") {
      try {
        const eventId = parseInt(path.split('/')[3]);

        const documents = db.query(`
          SELECT d.*, u.first_name, u.last_name
          FROM event_documents d
          JOIN users u ON d.uploaded_by = u.id
          WHERE d.event_id = ?
          ORDER BY d.created_at DESC
        `).all(eventId) as any[];

        return jsonResponse({
          documents: documents.map(doc => ({
            id: doc.id,
            filename: doc.filename,
            originalFilename: doc.original_filename,
            fileSize: doc.file_size,
            mimeType: doc.mime_type,
            uploadedBy: `${doc.first_name} ${doc.last_name}`,
            createdAt: doc.created_at
          }))
        });
      } catch (error) {
        console.error("Get documents error:", error);
        return jsonResponse({ error: "Failed to fetch documents" }, 500);
      }
    }

    // Download/view document
    if (path.match(/^\/api\/documents\/\d+\/download$/) && method === "GET") {
      try {
        const docId = parseInt(path.split('/')[3]);

        const document = db.query(`
          SELECT * FROM event_documents WHERE id = ?
        `).get(docId) as any;

        if (!document) {
          return jsonResponse({ error: "Document not found" }, 404);
        }

        // Check if file exists
        if (!fileExists(document.storage_path, document.storage_type)) {
          return jsonResponse({ error: "File not found in storage" }, 404);
        }

        // Stream file
        if (document.storage_type === 'local') {
          const fileStream = getFileStream(document.storage_path);

          return new Response(fileStream as any, {
            headers: {
              'Content-Type': document.mime_type,
              'Content-Disposition': `attachment; filename="${document.original_filename}"`,
              'Content-Length': document.file_size.toString()
            }
          });
        } else {
          // TODO: Handle R2 download
          return jsonResponse({ error: "R2 download not implemented" }, 500);
        }
      } catch (error) {
        console.error("Download document error:", error);
        return jsonResponse({ error: "Failed to download document" }, 500);
      }
    }

    // Delete document
    if (path.match(/^\/api\/documents\/\d+$/) && method === "DELETE") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const docId = parseInt(path.split('/')[3]);

        const document = db.query(`
          SELECT d.*, e.created_by as event_creator
          FROM event_documents d
          JOIN events e ON d.event_id = e.id
          WHERE d.id = ?
        `).get(docId) as any;

        if (!document) {
          return jsonResponse({ error: "Document not found" }, 404);
        }

        // Only uploader, event creator, or admins can delete
        if (document.uploaded_by !== user.id &&
            document.event_creator !== user.id &&
            user.role !== 'admin' &&
            user.role !== 'super_admin') {
          return jsonResponse({ error: "Forbidden" }, 403);
        }

        // Delete from storage
        await deleteFile(document.storage_path, document.storage_type);

        // Delete from database
        db.prepare("DELETE FROM event_documents WHERE id = ?").run(docId);

        return jsonResponse({ success: true, message: "Document deleted" });
      } catch (error) {
        console.error("Delete document error:", error);
        return jsonResponse({ error: "Failed to delete document" }, 500);
      }
    }

    // ===== RSVP ROUTES =====

    if (path.match(/^\/api\/rsvps\/\d+$/) && method === "GET") {
      try {
        const eventId = parseInt(path.split("/")[3]);

        const rsvps = db.query(`
          SELECT r.*, u.first_name, u.last_name
          FROM rsvps r
          JOIN users u ON r.user_id = u.id
          WHERE r.event_id = ?
        `).all(eventId) as any[];

        const formattedRsvps = rsvps.map((rsvp: any) => {
          // Get children attending for this RSVP
          const children = db.query(`
            SELECT c.id, c.name, c.birth_date, c.allergies, c.dietary_restrictions, c.medical_info
            FROM event_attendees ea
            JOIN children c ON ea.child_id = c.id
            WHERE ea.rsvp_id = ? AND ea.attending = 1
          `).all(rsvp.id) as any[];

          return {
            id: rsvp.id,
            eventId: rsvp.event_id,
            userId: rsvp.user_id,
            userName: `${rsvp.first_name} ${rsvp.last_name}`,
            status: rsvp.status,
            comment: rsvp.comment,
            createdAt: rsvp.created_at,
            children: children.map((child: any) => ({
              id: child.id,
              name: child.name,
              birthDate: child.birth_date,
              allergies: child.allergies,
              dietaryRestrictions: child.dietary_restrictions,
              medicalInfo: child.medical_info
            }))
          };
        });

        return jsonResponse({ rsvps: formattedRsvps });
      } catch (error) {
        console.error("Get RSVPs error:", error);
        return jsonResponse({ error: "Failed to fetch RSVPs" }, 500);
      }
    }

    if (path === "/api/rsvps" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { eventId, status, comment, childIds } = body;

        if (!eventId || !status) {
          return jsonResponse({ error: "Event ID and status required" }, 400);
        }

        if (!['going', 'maybe', 'not-going'].includes(status)) {
          return jsonResponse({ error: "Invalid status" }, 400);
        }

        // Check if RSVP exists
        const existing = db.query("SELECT id, status FROM rsvps WHERE event_id = ? AND user_id = ?").get(eventId, user.id) as any;

        let rsvpId: number;

        if (existing) {
          // Update existing RSVP
          db.run(
            "UPDATE rsvps SET status = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [status, comment || null, existing.id]
          );

          rsvpId = existing.id;

          // Update attendee count
          const oldStatus = existing.status;
          if (oldStatus === 'going' && status !== 'going') {
            db.run("UPDATE events SET current_attendees = current_attendees - 1 WHERE id = ?", [eventId]);
            // Clear notifications if user is no longer going
            db.prepare("DELETE FROM notification_queue WHERE rsvp_id = ?").run(existing.id);
          } else if (oldStatus !== 'going' && status === 'going') {
            db.run("UPDATE events SET current_attendees = current_attendees + 1 WHERE id = ?", [eventId]);
            // Schedule notifications when user changes to "going"
            scheduleNotificationsForRSVP(user.id, eventId, existing.id);
          }
        } else {
          // Create new RSVP
          const result = db.prepare(
            "INSERT INTO rsvps (event_id, user_id, status, comment) VALUES (?, ?, ?, ?)"
          ).run(eventId, user.id, status, comment || null);

          rsvpId = result.lastInsertRowid as number;

          // Update attendee count
          if (status === 'going') {
            db.run("UPDATE events SET current_attendees = current_attendees + 1 WHERE id = ?", [eventId]);
            // Schedule notifications for new "going" RSVP
            scheduleNotificationsForRSVP(user.id, eventId, rsvpId);
          }
        }

        // Handle child attendees
        if (childIds && Array.isArray(childIds)) {
          // Clear existing child attendees for this RSVP
          db.prepare("DELETE FROM event_attendees WHERE rsvp_id = ?").run(rsvpId);

          // Add selected children
          for (const childId of childIds) {
            // Verify this child belongs to the user
            const userChild = db.query(`
              SELECT id FROM user_children WHERE user_id = ? AND child_id = ?
            `).get(user.id, childId);

            if (userChild) {
              db.prepare(`
                INSERT INTO event_attendees (rsvp_id, child_id, attending)
                VALUES (?, ?, 1)
              `).run(rsvpId, childId);
            }
          }
        }

        return jsonResponse({
          message: existing ? "RSVP updated" : "RSVP created",
          rsvpId
        }, existing ? 200 : 201);
      } catch (error) {
        console.error("RSVP error:", error);
        return jsonResponse({ error: "Failed to process RSVP" }, 500);
      }
    }

    // Get current user's RSVP for an event
    if (path.match(/^\/api\/rsvps\/event\/\d+\/mine$/) && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const eventId = parseInt(path.split("/")[4]);

        const rsvp = db.query(`
          SELECT * FROM rsvps WHERE event_id = ? AND user_id = ?
        `).get(eventId, user.id) as any;

        if (!rsvp) {
          return jsonResponse({ rsvp: null });
        }

        // Get children attending for this RSVP
        const children = db.query(`
          SELECT c.id, c.name
          FROM event_attendees ea
          JOIN children c ON ea.child_id = c.id
          WHERE ea.rsvp_id = ? AND ea.attending = 1
        `).all(rsvp.id) as any[];

        return jsonResponse({
          rsvp: {
            id: rsvp.id,
            eventId: rsvp.event_id,
            status: rsvp.status,
            comment: rsvp.comment,
            childIds: children.map((c: any) => c.id)
          }
        });
      } catch (error) {
        console.error("Get my RSVP error:", error);
        return jsonResponse({ error: "Failed to fetch RSVP" }, 500);
      }
    }

    // ===== FORMS ROUTES =====

    if (path.match(/^\/api\/forms\/event\/\d+$/) && method === "GET") {
      try {
        const eventId = parseInt(path.split("/")[4]);

        const form = db.query(`
          SELECT * FROM forms WHERE event_id = ? AND is_active = 1
        `).get(eventId) as any;

        if (!form) {
          return jsonResponse({ form: null });
        }

        const fields = db.query(`
          SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order
        `).all(form.id) as any[];

        return jsonResponse({
          form: {
            id: form.id,
            eventId: form.event_id,
            formType: form.form_type,
            fields: fields.map(f => ({
              id: f.id,
              label: f.label,
              type: f.type,
              required: f.required === 1,
              placeholder: f.placeholder,
              options: f.options ? JSON.parse(f.options) : null
            }))
          }
        });
      } catch (error) {
        console.error("Get form error:", error);
        return jsonResponse({ error: "Failed to fetch form" }, 500);
      }
    }

    if (path === "/api/forms" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { eventId, formType, fields } = body;

        // Check if user can create forms for this event
        const event = db.query("SELECT creator_id FROM events WHERE id = ?").get(eventId) as any;
        if (!event) {
          return jsonResponse({ error: "Event not found" }, 404);
        }

        if (user.role === 'user' || (user.role === 'event_creator' && user.id !== event.creator_id)) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }

        // Create form
        const formResult = db.prepare(`
          INSERT INTO forms (event_id, creator_id, form_type, is_active)
          VALUES (?, ?, ?, 1)
        `).run(eventId, user.id, formType || 'signup');

        const formId = formResult.lastInsertRowid;

        // Create form fields
        if (fields && Array.isArray(fields)) {
          const insertField = db.prepare(`
            INSERT INTO form_fields (form_id, field_order, label, type, required, placeholder, options)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          fields.forEach((field: any, index: number) => {
            insertField.run(
              formId,
              index + 1,
              field.label,
              field.type,
              field.required ? 1 : 0,
              field.placeholder || null,
              field.options ? JSON.stringify(field.options) : null
            );
          });
        }

        return jsonResponse({ message: "Form created", formId }, 201);
      } catch (error) {
        console.error("Create form error:", error);
        return jsonResponse({ error: "Failed to create form" }, 500);
      }
    }

    if (path.match(/^\/api\/forms\/\d+$/) && method === "DELETE") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const formId = parseInt(path.split("/")[3]);

        const form = db.query("SELECT creator_id FROM forms WHERE id = ?").get(formId) as any;
        if (!form) {
          return jsonResponse({ error: "Form not found" }, 404);
        }

        if (user.role === 'user' || (user.role === 'event_creator' && user.id !== form.creator_id)) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }

        db.run("DELETE FROM forms WHERE id = ?", [formId]);
        return jsonResponse({ message: "Form deleted" });
      } catch (error) {
        console.error("Delete form error:", error);
        return jsonResponse({ error: "Failed to delete form" }, 500);
      }
    }

    if (path === "/api/forms/respond" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { formId, eventId, responses } = body;

        if (!formId || !eventId || !responses) {
          return jsonResponse({ error: "Form ID, event ID, and responses required" }, 400);
        }

        // Create form response
        const responseResult = db.prepare(`
          INSERT INTO form_responses (form_id, event_id, user_id)
          VALUES (?, ?, ?)
        `).run(formId, eventId, user.id);

        const responseId = responseResult.lastInsertRowid;

        // Save response values
        const insertValue = db.prepare(`
          INSERT INTO form_response_values (response_id, field_id, value)
          VALUES (?, ?, ?)
        `);

        for (const [fieldId, value] of Object.entries(responses)) {
          insertValue.run(responseId, parseInt(fieldId), String(value));
        }

        return jsonResponse({ message: "Form response submitted", responseId }, 201);
      } catch (error) {
        console.error("Submit form response error:", error);
        return jsonResponse({ error: "Failed to submit form response" }, 500);
      }
    }

    if (path.match(/^\/api\/forms\/\d+\/responses$/) && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const formId = parseInt(path.split("/")[3]);

        // Check permissions
        const form = db.query(`
          SELECT f.*, e.creator_id
          FROM forms f
          JOIN events e ON f.event_id = e.id
          WHERE f.id = ?
        `).get(formId) as any;

        if (!form) {
          return jsonResponse({ error: "Form not found" }, 404);
        }

        // Only event creator and admins can view responses
        if (user.role === 'user' || (user.role === 'event_creator' && user.id !== form.creator_id)) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }

        // Get all responses
        const responses = db.query(`
          SELECT
            fr.id,
            fr.submitted_at,
            u.first_name,
            u.last_name,
            u.email
          FROM form_responses fr
          JOIN users u ON fr.user_id = u.id
          WHERE fr.form_id = ?
          ORDER BY fr.submitted_at DESC
        `).all(formId) as any[];

        // Get response values for each response
        const formattedResponses = responses.map((response: any) => {
          const values = db.query(`
            SELECT frv.field_id, frv.value, ff.label
            FROM form_response_values frv
            JOIN form_fields ff ON frv.field_id = ff.id
            WHERE frv.response_id = ?
          `).all(response.id) as any[];

          return {
            id: response.id,
            submittedBy: `${response.first_name} ${response.last_name}`,
            email: response.email,
            submittedAt: response.submitted_at,
            values: values.reduce((acc: any, v: any) => {
              acc[v.label] = v.value;
              return acc;
            }, {})
          };
        });

        return jsonResponse({ responses: formattedResponses });
      } catch (error) {
        console.error("Get form responses error:", error);
        return jsonResponse({ error: "Failed to fetch form responses" }, 500);
      }
    }

    // ===== NOTIFICATION PREFERENCES =====

    // Get user's notification preferences
    if (path === "/api/notifications/preferences" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        let preferences = db.query(`
          SELECT * FROM notification_preferences WHERE user_id = ?
        `).get(user.id) as any;

        // Create default preferences if none exist
        if (!preferences) {
          db.prepare(`
            INSERT INTO notification_preferences (user_id)
            VALUES (?)
          `).run(user.id);

          preferences = db.query(`
            SELECT * FROM notification_preferences WHERE user_id = ?
          `).get(user.id) as any;
        }

        return jsonResponse({
          preferences: {
            reminder1Day: !!preferences.reminder_1day,
            reminder1Week: !!preferences.reminder_1week,
            reminder2Weeks: !!preferences.reminder_2weeks,
            reminder1Month: !!preferences.reminder_1month,
            reminderCustomDays: preferences.reminder_custom_days,
            emailEnabled: !!preferences.email_enabled,
            smsEnabled: !!preferences.sms_enabled,
            inAppEnabled: !!preferences.in_app_enabled,
            newEventNotifications: !!preferences.new_event_notifications
          }
        });
      } catch (error) {
        console.error("Get notification preferences error:", error);
        return jsonResponse({ error: "Failed to fetch preferences" }, 500);
      }
    }

    // Update user's notification preferences
    if (path === "/api/notifications/preferences" && method === "PUT") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const {
          reminder1Day,
          reminder1Week,
          reminder2Weeks,
          reminder1Month,
          reminderCustomDays,
          emailEnabled,
          smsEnabled,
          inAppEnabled,
          newEventNotifications
        } = body;

        // Update or insert preferences
        const existing = db.query(`
          SELECT id FROM notification_preferences WHERE user_id = ?
        `).get(user.id) as any;

        if (existing) {
          db.prepare(`
            UPDATE notification_preferences
            SET reminder_1day = ?,
                reminder_1week = ?,
                reminder_2weeks = ?,
                reminder_1month = ?,
                reminder_custom_days = ?,
                email_enabled = ?,
                sms_enabled = ?,
                in_app_enabled = ?,
                new_event_notifications = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).run(
            reminder1Day ? 1 : 0,
            reminder1Week ? 1 : 0,
            reminder2Weeks ? 1 : 0,
            reminder1Month ? 1 : 0,
            reminderCustomDays || null,
            emailEnabled ? 1 : 0,
            smsEnabled ? 1 : 0,
            inAppEnabled ? 1 : 0,
            newEventNotifications ? 1 : 0,
            user.id
          );
        } else {
          db.prepare(`
            INSERT INTO notification_preferences (
              user_id, reminder_1day, reminder_1week, reminder_2weeks,
              reminder_1month, reminder_custom_days, email_enabled, sms_enabled,
              in_app_enabled, new_event_notifications
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            user.id,
            reminder1Day ? 1 : 0,
            reminder1Week ? 1 : 0,
            reminder2Weeks ? 1 : 0,
            reminder1Month ? 1 : 0,
            reminderCustomDays || null,
            emailEnabled ? 1 : 0,
            smsEnabled ? 1 : 0,
            inAppEnabled ? 1 : 0,
            newEventNotifications ? 1 : 0
          );
        }

        return jsonResponse({ success: true, message: "Preferences updated" });
      } catch (error) {
        console.error("Update notification preferences error:", error);
        return jsonResponse({ error: "Failed to update preferences" }, 500);
      }
    }

    // ===== CHILDREN MANAGEMENT =====

    // Get all children for current user (including shared from linked accounts)
    if (path === "/api/children" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const children = db.query(`
          SELECT DISTINCT c.*, uc.relationship
          FROM children c
          JOIN user_children uc ON c.id = uc.child_id
          WHERE uc.user_id = ?
          ORDER BY c.name
        `).all(user.id) as any[];

        const formattedChildren = children.map(child => ({
          id: child.id,
          name: child.name,
          birthDate: child.birth_date,
          grade: child.grade,
          schoolType: child.school_type,
          allergies: child.allergies,
          dietaryRestrictions: child.dietary_restrictions,
          medicalInfo: child.medical_info,
          notes: child.notes,
          relationship: child.relationship
        }));

        return jsonResponse({ children: formattedChildren });
      } catch (error) {
        console.error("Get children error:", error);
        return jsonResponse({ error: "Failed to fetch children" }, 500);
      }
    }

    // Add a child
    if (path === "/api/children" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { name, birthDate, grade, schoolType, allergies, dietaryRestrictions, medicalInfo, notes } = body;

        if (!name || !name.trim()) {
          return jsonResponse({ error: "Child name is required" }, 400);
        }

        // Create child
        const childResult = db.prepare(`
          INSERT INTO children (name, birth_date, grade, school_type, allergies, dietary_restrictions, medical_info, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          name.trim(),
          birthDate || null,
          grade || null,
          schoolType || null,
          allergies || null,
          dietaryRestrictions || null,
          medicalInfo || null,
          notes || null
        );

        const childId = childResult.lastInsertRowid;

        // Link child to current user
        db.prepare(`
          INSERT INTO user_children (user_id, child_id, relationship)
          VALUES (?, ?, 'parent')
        `).run(user.id, childId);

        // If user has linked accounts, also link the child to them
        const linkedUsers = db.query(`
          SELECT CASE
            WHEN user1_id = ? THEN user2_id
            ELSE user1_id
          END as linked_user_id
          FROM linked_accounts
          WHERE user1_id = ? OR user2_id = ?
        `).all(user.id, user.id, user.id) as any[];

        for (const linkedUser of linkedUsers) {
          db.prepare(`
            INSERT INTO user_children (user_id, child_id, relationship)
            VALUES (?, ?, 'parent')
          `).run(linkedUser.linked_user_id, childId);
        }

        return jsonResponse({ message: "Child added successfully", childId }, 201);
      } catch (error) {
        console.error("Add child error:", error);
        return jsonResponse({ error: "Failed to add child" }, 500);
      }
    }

    // Update a child
    if (path.match(/^\/api\/children\/\d+$/) && method === "PUT") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const childId = parseInt(path.split("/")[3]);

        // Verify user has access to this child
        const access = db.query(`
          SELECT id FROM user_children WHERE user_id = ? AND child_id = ?
        `).get(user.id, childId);

        if (!access) {
          return jsonResponse({ error: "Forbidden - no access to this child" }, 403);
        }

        const body = await req.json();
        const { name, birthDate, grade, schoolType, allergies, dietaryRestrictions, medicalInfo, notes } = body;

        if (!name || !name.trim()) {
          return jsonResponse({ error: "Child name is required" }, 400);
        }

        db.prepare(`
          UPDATE children
          SET name = ?,
              birth_date = ?,
              grade = ?,
              school_type = ?,
              allergies = ?,
              dietary_restrictions = ?,
              medical_info = ?,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          name.trim(),
          birthDate || null,
          grade || null,
          schoolType || null,
          allergies || null,
          dietaryRestrictions || null,
          medicalInfo || null,
          notes || null,
          childId
        );

        return jsonResponse({ message: "Child updated successfully" });
      } catch (error) {
        console.error("Update child error:", error);
        return jsonResponse({ error: "Failed to update child" }, 500);
      }
    }

    // Delete a child
    if (path.match(/^\/api\/children\/\d+$/) && method === "DELETE") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const childId = parseInt(path.split("/")[3]);

        // Verify user has access to this child
        const access = db.query(`
          SELECT id FROM user_children WHERE user_id = ? AND child_id = ?
        `).get(user.id, childId);

        if (!access) {
          return jsonResponse({ error: "Forbidden - no access to this child" }, 403);
        }

        // Delete child (cascade will handle user_children and event_attendees)
        db.prepare(`DELETE FROM children WHERE id = ?`).run(childId);

        return jsonResponse({ message: "Child deleted successfully" });
      } catch (error) {
        console.error("Delete child error:", error);
        return jsonResponse({ error: "Failed to delete child" }, 500);
      }
    }

    // ===== ACCOUNT LINKING =====

    // Get linkable users (for spouse/partner selection)
    if (path === "/api/users/linkable" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        // Get all active users except current user and already linked users
        const alreadyLinked = db.query(`
          SELECT CASE
            WHEN user1_id = ? THEN user2_id
            ELSE user1_id
          END as linked_id
          FROM linked_accounts
          WHERE user1_id = ? OR user2_id = ?
        `).all(user.id, user.id, user.id) as any[];

        const linkedIds = alreadyLinked.map(l => l.linked_id);
        linkedIds.push(user.id); // Exclude self

        const placeholders = linkedIds.map(() => '?').join(',');
        const users = db.query(`
          SELECT id, email, first_name, last_name
          FROM users
          WHERE is_active = 1 AND id NOT IN (${placeholders})
          ORDER BY first_name, last_name
        `).all(...linkedIds) as any[];

        const formattedUsers = users.map(u => ({
          id: u.id,
          email: u.email,
          name: `${u.first_name} ${u.last_name}`
        }));

        return jsonResponse({ users: formattedUsers });
      } catch (error) {
        console.error("Get linkable users error:", error);
        return jsonResponse({ error: "Failed to fetch users" }, 500);
      }
    }

    // Link account to another user (spouse/partner)
    if (path === "/api/users/link" && method === "POST") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await req.json();
        const { userId, relationshipType } = body;

        if (!userId) {
          return jsonResponse({ error: "User ID is required" }, 400);
        }

        // Ensure user1_id < user2_id for consistency
        const user1Id = Math.min(user.id, userId);
        const user2Id = Math.max(user.id, userId);

        // Check if link already exists
        const existing = db.query(`
          SELECT id FROM linked_accounts
          WHERE user1_id = ? AND user2_id = ?
        `).get(user1Id, user2Id);

        if (existing) {
          return jsonResponse({ error: "Accounts are already linked" }, 400);
        }

        db.prepare(`
          INSERT INTO linked_accounts (user1_id, user2_id, relationship_type)
          VALUES (?, ?, ?)
        `).run(user1Id, user2Id, relationshipType || 'spouse');

        // Share all children between linked accounts
        const user1Children = db.query(`
          SELECT child_id FROM user_children WHERE user_id = ?
        `).all(user1Id) as any[];

        const user2Children = db.query(`
          SELECT child_id FROM user_children WHERE user_id = ?
        `).all(user2Id) as any[];

        // Add user1's children to user2
        for (const child of user1Children) {
          const exists = db.query(`
            SELECT id FROM user_children WHERE user_id = ? AND child_id = ?
          `).get(user2Id, child.child_id);

          if (!exists) {
            db.prepare(`
              INSERT INTO user_children (user_id, child_id, relationship)
              VALUES (?, ?, 'parent')
            `).run(user2Id, child.child_id);
          }
        }

        // Add user2's children to user1
        for (const child of user2Children) {
          const exists = db.query(`
            SELECT id FROM user_children WHERE user_id = ? AND child_id = ?
          `).get(user1Id, child.child_id);

          if (!exists) {
            db.prepare(`
              INSERT INTO user_children (user_id, child_id, relationship)
              VALUES (?, ?, 'parent')
            `).run(user1Id, child.child_id);
          }
        }

        return jsonResponse({ message: "Accounts linked successfully" }, 201);
      } catch (error) {
        console.error("Link accounts error:", error);
        return jsonResponse({ error: "Failed to link accounts" }, 500);
      }
    }

    // Get linked accounts
    if (path === "/api/users/linked" && method === "GET") {
      try {
        const user = getUserFromRequest(req);
        if (!user) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const linked = db.query(`
          SELECT
            CASE
              WHEN la.user1_id = ? THEN la.user2_id
              ELSE la.user1_id
            END as linked_user_id,
            la.relationship_type,
            u.first_name,
            u.last_name,
            u.email
          FROM linked_accounts la
          JOIN users u ON (
            CASE
              WHEN la.user1_id = ? THEN la.user2_id
              ELSE la.user1_id
            END
          ) = u.id
          WHERE la.user1_id = ? OR la.user2_id = ?
        `).all(user.id, user.id, user.id, user.id) as any[];

        const formattedLinked = linked.map(l => ({
          userId: l.linked_user_id,
          name: `${l.first_name} ${l.last_name}`,
          email: l.email,
          relationshipType: l.relationship_type
        }));

        return jsonResponse({ linkedAccounts: formattedLinked });
      } catch (error) {
        console.error("Get linked accounts error:", error);
        return jsonResponse({ error: "Failed to fetch linked accounts" }, 500);
      }
    }

    // ===== STATIC FILES =====

    if (path === "/") {
      return new Response(Bun.file("index.html"), {
        headers: { "Content-Type": "text/html" }
      });
    }

    if (path.startsWith("/src/")) {
      const filePath = `.${path}`;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const ext = path.split('.').pop();

        // Transpile TypeScript to JavaScript
        if (ext === 'ts') {
          const transpiled = await Bun.build({
            entrypoints: [filePath],
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'inline'
          });

          if (transpiled.success && transpiled.outputs.length > 0) {
            return new Response(transpiled.outputs[0], {
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache"
              }
            });
          }
        }

        const contentTypes: Record<string, string> = {
          'js': 'application/javascript',
          'css': 'text/css'
        };
        return new Response(file, {
          headers: {
            "Content-Type": contentTypes[ext || ''] || "text/plain",
            "Cache-Control": "no-cache"
          }
        });
      }
    }

    if (path.startsWith("/public/")) {
      const file = Bun.file(`.${path}`);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    if (path.startsWith("/uploads/")) {
      const file = Bun.file(`.${path}`);
      if (await file.exists()) {
        const ext = path.split('.').pop()?.toLowerCase();
        const contentTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'txt': 'text/plain'
        };
        return new Response(file, {
          headers: {
            "Content-Type": contentTypes[ext || ''] || "application/octet-stream",
            "Content-Disposition": `inline; filename="${path.split('/').pop()}"`
          }
        });
      }
    }

    // SPA fallback for client-side routes
    if (!path.startsWith("/api/")) {
      return new Response(Bun.file("index.html"), {
        headers: { "Content-Type": "text/html" }
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📦 Hot reload enabled - changes will refresh automatically`);
console.log(`\n📋 Test the API:`);
console.log(`   POST http://localhost:${server.port}/api/auth/login`);
console.log(`   GET  http://localhost:${server.port}/api/events`);
console.log(`\n🔑 Login with: admin@homeschool.com / admin123\n`);
