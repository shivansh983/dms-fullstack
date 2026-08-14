const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const userRepo = require('../repositories/userRepository');
const tokenRepo = require('../repositories/refreshTokenRepository');
const resetRepo = require('../repositories/passwordResetTokenRepository');
const tokenCache = require('../repositories/tokenCache');
const emailService = require('./emailService');
const tokens = require('./tokenService');

const googleClient = new OAuth2Client(config.google.clientId);

const RESET_GENERIC_MESSAGE =
  'If that email exists, a reset link has been sent.';

const MFA_CODE_TTL_SECONDS = 90;

function verifyTotp(secret, code) {
  if (!secret || !code) return false;

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(code),
    window: config.mfa.window,
  });
}

function present(user, hasPassword) {
  return { ...user.toJSON(), hasPassword };
}

function safeVerifyAccess(accessToken) {
  try {
    return tokens.verifyAccessToken(accessToken);
  } catch {
    return null;
  }
}

async function issueTokens(user) {
  const accessToken = tokens.signAccessToken(user);
  const refreshToken = tokens.signRefreshToken(user);

  const tokenHash = tokens.sha256(refreshToken);
  const expiresAt = tokens.expiryDateFromToken(refreshToken);

  await tokenRepo.create({ tokenHash, userId: user.id, expiresAt });

  await tokenCache.rememberRefresh(
    tokenHash,
    user.id,
    tokens.secondsUntilExpiry(expiresAt.getTime() / 1000)
  );

  return { accessToken, refreshToken };
}

async function register({ name, email, password }) {
  if (await userRepo.findByEmail(email)) {
    throw ApiError.conflict('That email is already registered');
  }

  const user = await userRepo.create({ name, email, password, role: 'user' });

  return { user: user.toJSON() };
}

async function login({ email, password }) {
  const user = await userRepo.findByEmailWithPassword(email);

  if (!user || !user.password || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.mfaEnabled) {
    return { mfaRequired: true, tempToken: tokens.signMfaToken(user) };
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return { user: present(user, true), accessToken, refreshToken };
}

async function loginWithGoogle({ idToken }) {
  if (!idToken) throw ApiError.badRequest('idToken is required');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google token');
  }

  if (!payload.email_verified) {
    throw ApiError.unauthorized('Google email is not verified');
  }

  let user = await userRepo.findByEmailWithPassword(payload.email);
  if (!user) {
    user = await userRepo.createFromGoogle({
      name: payload.name,
      email: payload.email,
      googleId: payload.sub,
    });
  }

  if (user.mfaEnabled) {
    return { mfaRequired: true, tempToken: tokens.signMfaToken(user) };
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return { user: present(user, Boolean(user.password)), accessToken, refreshToken };
}

async function refresh({ refreshToken }) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token is required');

  const payload = tokens.verifyRefreshToken(refreshToken);
  const tokenHash = tokens.sha256(refreshToken);

  const cachedUserId = await tokenCache.lookupRefresh(tokenHash);

  if (!cachedUserId) {
    const stored = await tokenRepo.findActive(tokenHash);
    if (!stored) throw ApiError.unauthorized('Session is no longer valid');

    await tokenCache.rememberRefresh(
      tokenHash,
      stored.userId,
      tokens.secondsUntilExpiry(stored.expiresAt.getTime() / 1000)
    );
  }

  const user = await userRepo.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  return { accessToken: tokens.signAccessToken(user) };
}

async function logout({ refreshToken, accessToken }) {
  if (refreshToken) {
    const tokenHash = tokens.sha256(refreshToken);
    await tokenRepo.revoke(tokenHash);
    await tokenCache.forgetRefresh(tokenHash);
  }

  if (accessToken) {
    const payload = safeVerifyAccess(accessToken);
    if (payload) {
      await tokenCache.denyAccess(
        payload.jti,
        tokens.secondsUntilExpiry(payload.exp)
      );
    }
  }

  return { ok: true };
}

async function logoutAll(userId) {
  await tokenRepo.revokeAllForUser(userId);
  await tokenCache.forgetAllForUser(userId);
  return { ok: true };
}

async function beginMfaSetup(userId) {
  const user = await userRepo.findByIdWithMfa(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.mfaEnabled) {
    throw ApiError.conflict('Two-factor is already enabled');
  }

  const secret = speakeasy.generateSecret({ length: config.mfa.secretBytes });

  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    encoding: 'base32',
    label: user.email,
    issuer: config.mfa.issuer,
  });

  await userRepo.setPendingMfaSecret(user.id, secret.base32);

  return {
    qrDataUrl: await QRCode.toDataURL(otpauthUrl),
    secret: secret.base32,
    otpauthUrl,
  };
}

async function confirmMfaSetup(userId, code) {
  const user = await userRepo.findByIdWithMfa(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.mfaEnabled) {
    throw ApiError.conflict('Two-factor is already enabled');
  }

  if (!user.pendingMfaSecret) {
    throw ApiError.badRequest('Start two-factor setup before confirming');
  }

  if (!verifyTotp(user.pendingMfaSecret, code)) {
    throw ApiError.badRequest('Incorrect code, try again');
  }

  await userRepo.enableMfa(user.id, user.pendingMfaSecret);

  return { message: 'Two-factor authentication is now enabled', mfaEnabled: true };
}

async function verifyMfa({ tempToken, code }) {
  const expired = ApiError.unauthorized('Two-factor session expired. Sign in again.');

  if (!tempToken) throw expired;

  let payload;
  try {
    payload = tokens.verifyMfaToken(tempToken);
  } catch {
    throw expired;
  }

  const user = await userRepo.findByIdWithMfa(payload.sub);

  if (!user || !user.mfaEnabled) {
    throw ApiError.unauthorized('Two-factor is not enabled for this account');
  }

  if (!verifyTotp(user.mfaSecret, code)) {
    throw ApiError.unauthorized('Incorrect code');
  }

  const fresh = await tokenCache.consumeMfaCode(user.id, code, MFA_CODE_TTL_SECONDS);
  if (!fresh) throw ApiError.unauthorized('That code was already used. Wait for the next one.');

  const { accessToken, refreshToken } = await issueTokens(user);
  const withPassword = await userRepo.findByIdWithPassword(user.id);

  return {
    user: present(user, Boolean(withPassword?.password)),
    accessToken,
    refreshToken,
  };
}

async function disableMfa(userId, code) {
  const user = await userRepo.findByIdWithMfa(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (!user.mfaEnabled) {
    throw ApiError.badRequest('Two-factor is not enabled');
  }

  if (!verifyTotp(user.mfaSecret, code)) {
    throw ApiError.badRequest('Incorrect code');
  }

  await userRepo.disableMfa(user.id);

  return { message: 'Two-factor authentication is now off', mfaEnabled: false };
}

async function setPassword(userId, newPassword) {
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.password) {
    throw ApiError.conflict('This account already has a password');
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password created. You can now sign in with it.', hasPassword: true };
}

async function forgotPassword({ email }) {
  const user = await userRepo.findByEmailWithPassword(email);

  if (!user || !user.password) {
    return { message: RESET_GENERIC_MESSAGE };
  }

  await resetRepo.invalidateAllForUser(user.id);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const { ttlMinutes } = config.passwordReset;

  await resetRepo.create({
    userId: user.id,
    tokenHash: tokens.sha256(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  });

  const link = `${config.passwordReset.linkBase}?token=${rawToken}`;

  try {
    const sent = await emailService.sendPasswordReset(user.email, link, ttlMinutes);

    if (!sent && !config.isProduction) {
      logger.warn(`reset link for ${user.email}: ${link}`);
    }
  } catch (err) {
    logger.error(`password reset email failed for user ${user.id}: ${err.message}`);
  }

  return { message: RESET_GENERIC_MESSAGE };
}

async function resetPassword({ token, newPassword }) {
  const invalid = ApiError.badRequest('Reset link is invalid or has expired');

  const record = await resetRepo.findValid(tokens.sha256(token));
  if (!record) throw invalid;

  const [claimed] = await resetRepo.consume(record.id);
  if (!claimed) throw invalid;

  const user = await userRepo.findByIdWithPassword(record.userId);
  if (!user) throw invalid;

  user.password = newPassword;
  await user.save();

  await logoutAll(user.id);

  try {
    await emailService.sendPasswordChanged(user.email);
  } catch (err) {
    logger.error(`password change notice failed for user ${user.id}: ${err.message}`);
  }

  return { message: 'Password updated. You can now sign in.' };
}

module.exports = {
  register,
  login,
  loginWithGoogle,
  refresh,
  logout,
  logoutAll,
  beginMfaSetup,
  confirmMfaSetup,
  verifyMfa,
  disableMfa,
  setPassword,
  forgotPassword,
  resetPassword,
};