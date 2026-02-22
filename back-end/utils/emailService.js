import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be set in environment");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });
};

/**
 * Send an email (e.g. OTP). from defaults to SMTP_USER.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: from || "noreply@example.com",
    to: Array.isArray(to) ? to.join(", ") : to,
    subject: subject || "Message",
    text: text || "",
    html: html || (text ? text.replace(/\n/g, "<br>") : ""),
  });
};
