const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

// const { Resend } = require('resend');
// const resend = config.email.apiKey ? new Resend(config.email.apiKey) : null;

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

  // const { error } = await resend.emails.send({
  //   from: config.email.from,
  //   to,
  //   subject,
  //   html,
  // });
  //
  // if (error) throw new Error(error.message || 'Email provider rejected the request');
  //
  // return true;
}

async function sendPasswordReset(to, resetLink, minutes, token) {
  return send({
    to,
    subject: 'Reset your password',
    html: `<p>We received a request to reset your Document Manager password.</p>
           <p>Open the app, go to <b>Forgot password &rarr; I have a reset token</b>, and paste this token:</p>
           <p style="font-family:monospace;font-size:15px;word-break:break-all;background:#f4f4f5;padding:12px;border-radius:6px">${token}</p>
           <p>On a phone this link may open the app directly: <a href="${resetLink}">${resetLink}</a></p>
           <p>This token expires in ${minutes} minutes and can only be used once.</p>
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
