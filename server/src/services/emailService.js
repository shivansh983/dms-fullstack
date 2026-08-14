const { Resend } = require('resend');
const config = require('../config/env');
const logger = require('../utils/logger');

const resend = config.email.apiKey ? new Resend(config.email.apiKey) : null;

async function send({ to, subject, html }) {
  if (!resend) {
    logger.warn(`email not sent, RESEND_API_KEY is unset: "${subject}" to ${to}`);
    return false;
  }

  const { error } = await resend.emails.send({
    from: config.email.from,
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message || 'Email provider rejected the request');

  return true;
}

async function sendPasswordReset(to, resetLink, minutes) {
  return send({
    to,
    subject: 'Reset your password',
    html: `<p>We received a request to reset your Document Manager password.</p>
           <p><a href="${resetLink}">Reset password</a></p>
           <p>This link expires in ${minutes} minutes and can only be used once.</p>
           <p>If you did not request this, you can ignore this email.</p>`,
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
