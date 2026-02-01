# Email Notification System Setup

The homeschool group app now includes a complete email notification system for event reminders using Mailgun.

## Features

- **User-Configurable Reminders**: Users can choose when they want to be reminded about events
- **Multiple Reminder Options**:
  - 1 day before
  - 1 week before
  - 2 weeks before
  - 1 month before
  - Custom (any number of days before)
- **Automatic Scheduling**: Notifications are automatically scheduled when users RSVP as "Going"
- **Email Integration**: Uses Mailgun for professional email delivery

## Database Tables

### `notification_preferences`
Stores user preferences for event notifications:
- `user_id`: User who owns these preferences
- `reminder_1day`, `reminder_1week`, `reminder_2weeks`, `reminder_1month`: Boolean flags
- `reminder_custom_days`: Custom number of days for reminder
- `email_enabled`: Master toggle for all email notifications

### `notification_queue`
Tracks scheduled notifications:
- `user_id`, `event_id`, `rsvp_id`: References to related records
- `notification_type`: Type of reminder (1day, 1week, etc.)
- `scheduled_for`: When to send the notification
- `sent`: Boolean flag indicating if sent
- `sent_at`: When it was sent
- `error_message`: Any error that occurred

## Mailgun Configuration

### 1. Sign Up for Mailgun

1. Go to [mailgun.com](https://www.mailgun.com/) and create an account
2. Verify your email address
3. Add and verify your sending domain (or use the sandbox domain for testing)

### 2. Get Your API Credentials

1. Go to Settings > API Keys
2. Copy your Private API key
3. Note your domain name (e.g., `mg.yourdomain.com` or sandbox domain)

### 3. Configure Environment Variables

Add these to your `.env` file (create one if it doesn't exist):

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your_private_api_key_here
MAILGUN_DOMAIN=mg.yourdomain.com
FROM_EMAIL=noreply@mg.yourdomain.com

# Server Configuration
PORT=3000
```

**For Development/Testing** (emails will be logged to console if Mailgun is not configured):
```bash
# Leave Mailgun variables blank for dev mode
# MAILGUN_API_KEY=
# MAILGUN_DOMAIN=
FROM_EMAIL=noreply@homeschoolgroup.com
```

## Running the Notification Processor

The notification processor checks for due notifications and sends emails. It should be run periodically.

### Manual Execution

```bash
bun run notifications:process
```

### Automated Scheduling

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to run every 15 minutes
4. Set action to run: `bun run notifications:process` in your project directory

#### Linux/Mac (Cron)

Add to crontab (`crontab -e`):

```cron
# Run every 15 minutes
*/15 * * * * cd /path/to/home-school-group && bun run notifications:process >> /var/log/notifications.log 2>&1
```

#### Production (PM2 + Cron)

```bash
# Install PM2 globally
npm install -g pm2

# Create a PM2 cron job
pm2 start "bun run notifications:process" --cron "*/15 * * * *" --name "notification-processor" --no-autorestart
```

## User Interface

### Accessing Notification Settings

1. Log in to the app
2. Click the **🔔 Notifications** button (next to Member Directory)
3. Configure your preferences:
   - Enable/disable email notifications
   - Choose reminder times (1 day, 1 week, 2 weeks, 1 month)
   - Set custom reminder days if needed
4. Click **Save Notification Settings**

### How It Works

1. **User RSVPs**: When a user RSVPs as "Going" to an event, notifications are automatically scheduled based on their preferences
2. **Scheduler Runs**: The notification processor runs every 15 minutes (or as configured)
3. **Emails Sent**: When a notification's scheduled time arrives, an email is sent to the user
4. **Tracking**: The system tracks sent notifications and any errors

## Email Template

Reminder emails include:
- Event title and description
- Event date and time (formatted nicely)
- Location information
- Reminder type (e.g., "1 week before")
- Professional HTML formatting with your app's forest green theme

## Testing

### Test in Development Mode

1. Ensure Mailgun is **not** configured (leave env vars blank)
2. RSVP to an event with a start date soon (e.g., tomorrow)
3. Set notification preference to "1 day before"
4. Run: `bun run notifications:process`
5. Check console output for logged "email" (won't actually send)

### Test with Mailgun Sandbox

1. Configure Mailgun with sandbox domain
2. Add your email to authorized recipients in Mailgun dashboard
3. Follow same steps as above
4. You should receive real test emails

## Production Deployment

1. Set up a verified domain in Mailgun
2. Configure all environment variables
3. Set up automated task scheduling
4. Monitor logs for any errors
5. Adjust cron frequency based on volume (15 minutes recommended)

## Troubleshooting

### Emails Not Sending

- Check Mailgun API credentials
- Verify domain is verified in Mailgun
- Check notification_queue table for error_message column
- Review server logs for Mailgun errors

### Notifications Not Scheduled

- Verify user has email_enabled set to 1
- Check that RSVP status is 'going'
- Ensure event start_date is in the future
- Review notification_preferences table

### Duplicate Emails

- Check cron job isn't running multiple times
- Verify only one instance of processor is running
- Check notification_queue for duplicate entries

## Future Enhancements

- SMS notifications (via Twilio)
- In-app notifications
- Digest emails (daily/weekly summaries)
- Event cancellation notifications
- New event announcements
- Comment notifications

## API Endpoints

### Get User Preferences
```
GET /api/notifications/preferences
Authorization: Bearer <token>
```

### Update Preferences
```
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailEnabled": true,
  "reminder1Day": true,
  "reminder1Week": true,
  "reminder2Weeks": false,
  "reminder1Month": false,
  "reminderCustomDays": null
}
```

## Support

For issues or questions:
- Check Mailgun documentation: https://documentation.mailgun.com/
- Review server logs in the console
- Check the notification_queue and notification_preferences tables
- Verify environment variables are set correctly
