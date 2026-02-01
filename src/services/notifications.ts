import Mailgun from 'mailgun.js';
import FormData from 'form-data';

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@homeschoolgroup.com';

// Initialize Mailgun client only if credentials are provided
let mg: any = null;
if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
  const mailgun = new Mailgun(FormData);
  mg = mailgun.client({
    username: 'api',
    key: MAILGUN_API_KEY
  });
}

export interface NotificationEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send email via Mailgun
 */
export async function sendEmail(emailData: NotificationEmail): Promise<boolean> {
  // If Mailgun is not configured, just log to console
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.log('📧 [DEV MODE] Email would be sent:', emailData);
    return true;
  }

  try {
    const message = {
      from: FROM_EMAIL,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    };

    await mg.messages.create(MAILGUN_DOMAIN, message);
    console.log(`✅ Email sent to ${emailData.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Generate event reminder email HTML
 */
export function generateEventReminderEmail(
  userName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  reminderType: string
): NotificationEmail {
  const subject = `Reminder: ${eventTitle} - ${reminderType}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #5d6d3e 0%, #3a4528 100%); color: #fefdfb; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a5d23; }
          .event-details h3 { margin-top: 0; color: #4a5d23; }
          .event-details p { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #4a5d23; color: #fefdfb; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Event Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>This is a friendly reminder about an upcoming event you're attending:</p>

            <div class="event-details">
              <h3>${eventTitle}</h3>
              <p><strong>📅 Date:</strong> ${eventDate}</p>
              <p><strong>📍 Location:</strong> ${eventLocation}</p>
              <p><strong>⏰ Reminder:</strong> ${reminderType}</p>
            </div>

            <p>We're looking forward to seeing you there!</p>

            <p style="margin-top: 20px;">
              <strong>Questions?</strong> Reply to this email or contact the event organizer.
            </p>
          </div>
          <div class="footer">
            <p>You're receiving this email because you RSVP'd to this event.</p>
            <p>To manage your notification preferences, log in to your account.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Event Reminder: ${eventTitle}

    Hi ${userName},

    This is a reminder about an upcoming event you're attending:

    Event: ${eventTitle}
    Date: ${eventDate}
    Location: ${eventLocation}
    Reminder: ${reminderType}

    We're looking forward to seeing you there!

    Questions? Reply to this email or contact the event organizer.

    ---
    You're receiving this email because you RSVP'd to this event.
    To manage your notification preferences, log in to your account.
  `;

  return {
    to: '',
    subject,
    html,
    text
  };
}

/**
 * Get reminder type label
 */
export function getReminderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    '1day': '1 day before',
    '1week': '1 week before',
    '2weeks': '2 weeks before',
    '1month': '1 month before',
    'custom': 'Custom reminder'
  };
  return labels[type] || type;
}

/**
 * Calculate notification date based on event date and reminder type
 */
export function calculateNotificationDate(eventDate: Date, reminderType: string, customDays?: number): Date {
  const notificationDate = new Date(eventDate);

  switch (reminderType) {
    case '1day':
      notificationDate.setDate(notificationDate.getDate() - 1);
      break;
    case '1week':
      notificationDate.setDate(notificationDate.getDate() - 7);
      break;
    case '2weeks':
      notificationDate.setDate(notificationDate.getDate() - 14);
      break;
    case '1month':
      notificationDate.setMonth(notificationDate.getMonth() - 1);
      break;
    case 'custom':
      if (customDays) {
        notificationDate.setDate(notificationDate.getDate() - customDays);
      }
      break;
  }

  return notificationDate;
}

/**
 * Generate new event announcement email HTML
 */
export function generateNewEventEmail(
  userName: string,
  eventTitle: string,
  eventDescription: string,
  eventDate: string,
  eventLocation: string,
  eventCategory: string,
  eventCost: string,
  ageRange: string
): NotificationEmail {
  const subject = `New Event: ${eventTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #5d6d3e 0%, #3a4528 100%); color: #fefdfb; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a5d23; }
          .event-details h3 { margin-top: 0; color: #4a5d23; }
          .event-details p { margin: 10px 0; }
          .event-meta { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
          .badge { display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, rgba(107, 124, 63, 0.12) 0%, rgba(139, 119, 101, 0.12) 100%); color: #3d3321; border-radius: 20px; font-size: 14px; font-weight: 600; border: 1.5px solid rgba(107, 124, 63, 0.25); }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #4a5d23; color: #fefdfb; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Event Posted!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>A new event has been published that might interest you:</p>

            <div class="event-details">
              <h3>${eventTitle}</h3>
              <p>${eventDescription}</p>

              <div class="event-meta">
                <span class="badge">📅 ${eventDate}</span>
                <span class="badge">📍 ${eventLocation}</span>
                <span class="badge">💰 ${eventCost}</span>
                <span class="badge">👶 ${ageRange}</span>
                <span class="badge">📂 ${eventCategory}</span>
              </div>
            </div>

            <p><strong>Don't miss out!</strong> Log in to your account to RSVP and see full event details.</p>
          </div>
          <div class="footer">
            <p>You're receiving this email because you opted in to new event notifications.</p>
            <p>To manage your notification preferences, log in to your account and click the 🔔 Notifications button.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    New Event Posted: ${eventTitle}

    Hi ${userName},

    A new event has been published that might interest you:

    ${eventTitle}
    ${eventDescription}

    Date: ${eventDate}
    Location: ${eventLocation}
    Cost: ${eventCost}
    Age Range: ${ageRange}
    Category: ${eventCategory}

    Don't miss out! Log in to your account to RSVP and see full event details.

    ---
    You're receiving this email because you opted in to new event notifications.
    To manage your notification preferences, log in to your account and click the 🔔 Notifications button.
  `;

  return {
    to: '',
    subject,
    html,
    text
  };
}

/**
 * Generate email verification code email HTML
 */
export function generateVerificationEmail(
  userName: string,
  verificationCode: string
): NotificationEmail {
  const subject = 'Verify Your Email Address';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #748c61 0%, #5d7a4a 100%); color: #fefdfb; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .code-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #6b7c3f; }
          .code { font-size: 36px; font-weight: bold; color: #4a5d23; letter-spacing: 8px; font-family: monospace; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>

            <div class="code-box">
              <div class="code">${verificationCode}</div>
            </div>

            <p>This code will expire in 24 hours.</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't create an account, please ignore this email.
            </div>

            <p>After verification, you'll be able to access all features of the homeschool group platform.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Verify Your Email Address

    Hi ${userName},

    Thank you for signing up! To complete your registration, please verify your email address using the code below:

    Verification Code: ${verificationCode}

    This code will expire in 24 hours.

    ⚠️ Security Notice: If you didn't create an account, please ignore this email.

    After verification, you'll be able to access all features of the homeschool group platform.

    ---
    This is an automated message. Please do not reply to this email.
  `;

  return {
    to: '',
    subject,
    html,
    text
  };
}
