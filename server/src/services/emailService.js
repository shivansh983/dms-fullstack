const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

const { host, port, secure, user, password } = config.email.smtp;

const transporter = host
  ? nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && password ? { user, pass: password } : undefined,
    })
  : null;

async function send({ to, subject, html }) {
  if (!transporter) {
    logger.warn(`email not sent, SMTP_HOST is unset: "${subject}" to ${to}`);
    return false;
  }

  const info = await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });

  if (info.rejected?.length) {
    throw new Error(`Mail server rejected ${info.rejected.join(', ')}`);
  }

  return true;
}

async function sendPasswordReset(to, resetLink, minutes) {
  return send({
    to,
    subject: 'Reset your password',
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;color:#0f172a">
             <p>We received a request to reset your Document Manager password.</p>
             <p style="margin:24px 0">
               <a href="${resetLink}"
                  style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600">
                 Reset my password
               </a>
             </p>
             <p style="color:#475569;font-size:14px">
               This link opens the app and expires in ${minutes} minutes. It can only be used once.
             </p>
             <p style="color:#475569;font-size:14px">
               If you did not request this, you can safely ignore this email &mdash; your password will not change.
             </p>
           </div>`,
  });
}

async function sendPasswordChanged(to) {
  return send({
    to,
    subject: 'Your password was changed',
    html: `<p>Your Document Manager password was just changed.</p>
           <p>If this was not you, reset your password immediately and contact support.</p>`,
  });
}

module.exports = { send, sendPasswordReset, sendPasswordChanged };
