# Home School Group

A full-featured event management and community platform built for homeschool families. Create events, coordinate activities, manage RSVPs, organize carpools, and keep your community connected — all in one place.

## Features

**Event Management**
- Create and manage events with a full approval workflow (Draft > Submit > Approve > Publish)
- 11 event categories: field trips, co-ops, park days, sports, arts, music, and more
- Recurring event support (weekly, biweekly, monthly)
- Custom registration forms per event
- iCal export for calendar integration
- File attachments and fee tracking

**Community Tools**
- Family directory with privacy controls
- Carpool coordination board
- Volunteer slot signup
- Community announcements with priority levels
- Event comments and discussion

**Family Accounts**
- Link spouse/co-parent accounts
- Child profiles with grade level and dietary needs
- Shared family event management

**Email Notifications**
- Configurable event reminders (1 day, 1 week, 2 weeks, 1 month, or custom)
- Automated notification queue with background processor
- Branded HTML email templates via Mailgun SMTP

**Admin Dashboard**
- User approval workflow for new members
- Role-based access control (user, admin, super_admin)
- Invite system with auto-approval
- Event moderation queue
- Full audit logging of all actions

**Security**
- JWT authentication with HTTP-only cookies
- bcrypt password hashing
- CSRF protection and security headers
- Rate limiting on sensitive endpoints
- Email verification requirement

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript 6](https://www.typescriptlang.org/) |
| UI | [React 19](https://react.dev/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [MongoDB](https://www.mongodb.com/) |
| Validation | [Zod 4](https://zod.dev/) |
| Auth | JWT + bcrypt |
| Email | [Nodemailer](https://nodemailer.com/) (Mailgun SMTP) |
| Runtime | [Bun](https://bun.sh/) |

## Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [MongoDB](https://www.mongodb.com/) instance (local or Atlas)
- [Mailgun](https://www.mailgun.com/) account (optional — emails log to console without it)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Technologies-Unlimited/HomeSchoolApp.git
cd HomeSchoolApp
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `MONGODB_DB_NAME` | Database name (defaults to connection string db) | No |
| `JWT_SECRET` | Secret key for signing JWTs | Yes |
| `JWT_EXPIRES_IN` | Token expiry duration (default: `7d`) | No |
| `MAILGUN_SMTP_HOST` | SMTP server (e.g., `smtp.mailgun.org`) | No |
| `MAILGUN_SMTP_PORT` | SMTP port (default: `587`) | No |
| `MAILGUN_SMTP_USER` | SMTP username | No |
| `MAILGUN_SMTP_PASS` | SMTP password | No |
| `FROM_EMAIL` | Sender email address | No |
| `CRON_SECRET` | Secret for authenticating cron job requests | No |

### 4. Initialize database indexes

```bash
bun scripts/ensure-indexes.ts
```

### 5. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/                  # REST API routes
│   │   ├── auth/             # Login, register, verify, reset password
│   │   ├── admin/            # User management, approvals, invites, audit
│   │   ├── events/           # Event CRUD and approval workflow
│   │   ├── rsvps/            # RSVP management
│   │   ├── comments/         # Event comments
│   │   ├── notifications/    # Email notification preferences
│   │   ├── cron/             # Background notification processor
│   │   ├── family/           # Family linking and child profiles
│   │   ├── directory/        # Community directory
│   │   ├── forms/            # Custom form builder
│   │   ├── locations/        # Saved locations
│   │   ├── announcements/    # Community announcements
│   │   └── health/           # Health check
│   └── (pages)/              # User-facing pages
├── components/               # Reusable React components
├── lib/                      # Utilities, auth, validation, email templates
└── proxy.ts                  # Auth middleware and rate limiting
scripts/
└── ensure-indexes.ts         # MongoDB index setup
```

## Notification Processor

Event reminder emails are processed by a background cron job. To run it:

```bash
# Manual
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/notifications

# Cron (every 15 minutes)
*/15 * * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/notifications
```

Without Mailgun configured, emails are logged to the console for development.

## Deployment

This project is configured for [Vercel](https://vercel.com/):

```bash
bun run build
```

Set your environment variables in the Vercel dashboard and deploy. See `vercel.json` for the deployment configuration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
