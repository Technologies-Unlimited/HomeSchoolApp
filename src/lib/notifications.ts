import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const smtpHost = process.env.MAILGUN_SMTP_HOST;
  const smtpPort = Number(process.env.MAILGUN_SMTP_PORT ?? "587");
  const smtpUser = process.env.MAILGUN_SMTP_USER;
  const smtpPass = process.env.MAILGUN_SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("Missing Mailgun SMTP environment variables.");
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return cachedTransporter;
}

export async function sendNotificationEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const fromEmail = process.env.FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("Missing FROM_EMAIL environment variable.");
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    html,
  });
}
