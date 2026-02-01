/**
 * Notification Processor
 *
 * This script processes the notification queue and sends emails for
 * scheduled reminders. It should be run periodically (e.g., every 15 minutes)
 * using a cron job or task scheduler.
 *
 * Usage: bun run src/scripts/process-notifications.ts
 */

import { getDB } from "../db/index.ts";
import { sendEmail, generateEventReminderEmail, getReminderTypeLabel } from "../services/notifications.ts";

const db = getDB();

async function processNotifications() {
  console.log('📧 Processing notification queue...');

  try {
    // Get all notifications that are due and not yet sent
    const dueNotifications = db.query(`
      SELECT
        nq.*,
        u.email, u.first_name, u.last_name,
        e.title, e.start_date, e.location_name, e.location_address
      FROM notification_queue nq
      JOIN users u ON nq.user_id = u.id
      JOIN events e ON nq.event_id = e.id
      WHERE nq.sent = 0
        AND nq.scheduled_for <= datetime('now')
      ORDER BY nq.scheduled_for ASC
      LIMIT 100
    `).all() as any[];

    if (dueNotifications.length === 0) {
      console.log('✅ No notifications due at this time.');
      return;
    }

    console.log(`📬 Found ${dueNotifications.length} notification(s) to send.`);

    let successCount = 0;
    let failureCount = 0;

    for (const notification of dueNotifications) {
      try {
        // Format event date
        const eventDate = new Date(notification.start_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Format location
        const location = notification.location_address
          ? `${notification.location_name}, ${notification.location_address}`
          : notification.location_name || 'TBD';

        // Generate email content
        const emailData = generateEventReminderEmail(
          notification.first_name,
          notification.title,
          formattedDate,
          location,
          getReminderTypeLabel(notification.notification_type)
        );

        // Set recipient email
        emailData.to = notification.email;

        // Send email
        const success = await sendEmail(emailData);

        if (success) {
          // Mark as sent
          db.prepare(`
            UPDATE notification_queue
            SET sent = 1, sent_at = datetime('now')
            WHERE id = ?
          `).run(notification.id);

          console.log(`✅ Sent notification to ${notification.email} for event "${notification.title}"`);
          successCount++;
        } else {
          // Record error
          db.prepare(`
            UPDATE notification_queue
            SET error_message = ?
            WHERE id = ?
          `).run('Failed to send email', notification.id);

          console.error(`❌ Failed to send notification to ${notification.email}`);
          failureCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);

        // Record error
        db.prepare(`
          UPDATE notification_queue
          SET error_message = ?
          WHERE id = ?
        `).run(String(error), notification.id);

        failureCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Sent: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📧 Total: ${dueNotifications.length}`);

  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the processor
processNotifications()
  .then(() => {
    console.log('\n✅ Notification processing complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification processing failed:', error);
    process.exit(1);
  });
