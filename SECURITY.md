# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email **mkgoluba@outlook.com** with:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

You should receive an acknowledgment within 48 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Security Best Practices for Deployers

- Never commit `.env` files or secrets to version control
- Use strong, unique values for `JWT_SECRET` and `CRON_SECRET`
- Enable HTTPS in production (enforced by default on Vercel)
- Keep dependencies up to date (`bun update`)
- Restrict MongoDB network access to your application servers
- Use Mailgun's verified domain (not sandbox) in production
