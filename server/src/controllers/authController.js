const crypto = require('crypto');

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const config = require('../config/env');
const bridge = require('../views/passwordResetBridge');

const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

exports.googleLogin = asyncHandler(async (req, res) => {
  res.json(await authService.loginWithGoogle(req.body));
});

exports.refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.body));
});

exports.mfaSetup = asyncHandler(async (req, res) => {
  res.json(await authService.beginMfaSetup(req.user.id));
});

exports.mfaConfirm = asyncHandler(async (req, res) => {
  res.json(await authService.confirmMfaSetup(req.user.id, req.body.code));
});

exports.mfaVerify = asyncHandler(async (req, res) => {
  res.json(await authService.verifyMfa(req.body));
});

exports.mfaDisable = asyncHandler(async (req, res) => {
  res.json(await authService.disableMfa(req.user.id, req.body.code));
});

exports.setPassword = asyncHandler(async (req, res) => {
  res.json(await authService.setPassword(req.user.id, req.body.newPassword));
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  res.json(await authService.forgotPassword(req.body));
});

exports.resetPassword = asyncHandler(async (req, res) => {
  res.json(await authService.resetPassword(req.body));
});

exports.resetRedirect = (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64');

  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'`
  );
  res.type('html');

  const token = String(req.query.token || '');

  if (!RESET_TOKEN_PATTERN.test(token)) {
    return res.status(400).send(bridge.renderInvalid());
  }

  const deepLink = `${config.passwordReset.appLinkBase}?token=${token}`;

  return res.send(
    bridge.render({ deepLink, minutes: config.passwordReset.ttlMinutes, nonce })
  );
};

exports.logout = asyncHandler(async (req, res) => {
  res.json(
    await authService.logout({
      refreshToken: req.body?.refreshToken,
      accessToken: bearerToken(req),
    })
  );
});