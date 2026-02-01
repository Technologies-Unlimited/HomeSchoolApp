import nodemailer from "nodemailer";

const smtpHost = process.env.MAILGUN_SMTP_HOST;
const smtpPort = Number(process.env.MAILGUN_SMTP_PORT ?? "587");
const smtpUser = process.env.MAILGUN_SMTP_USER;
const smtpPass = process.env.MAILGUN_SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL;

if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
  throw new Error("Missing Mailgun SMTP environment variables.");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendNotificationEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    html,
  });
}
