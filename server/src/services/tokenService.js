const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const MFA_TOKEN_TYPE = 'mfa';
const VIEW_TOKEN_TYPE = 'view';

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, jti: crypto.randomUUID() },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpires }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires }
  );
}

function signMfaToken(user) {
  return jwt.sign(
    { sub: user.id, typ: MFA_TOKEN_TYPE, jti: crypto.randomUUID() },
    config.jwt.accessSecret,
    { expiresIn: config.mfa.tempTokenExpires }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyMfaToken(token) {
  const payload = jwt.verify(token, config.jwt.accessSecret);

  if (payload.typ !== MFA_TOKEN_TYPE) {
    throw new jwt.JsonWebTokenError('Not an MFA token');
  }

  return payload;
}

function signViewToken({ documentId, userId, expiresIn }) {
  return jwt.sign(
    { sub: userId, doc: documentId, typ: VIEW_TOKEN_TYPE },
    config.jwt.accessSecret,
    { expiresIn }
  );
}

function verifyViewToken(token) {
  const payload = jwt.verify(token, config.jwt.accessSecret);

  if (payload.typ !== VIEW_TOKEN_TYPE) {
    throw new jwt.JsonWebTokenError('Not a view token');
  }

  return payload;
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

function expiryDateFromToken(token) {
  const { exp } = jwt.decode(token);
  return new Date(exp * 1000);
}

function secondsUntilExpiry(exp) {
  return Math.max(0, Math.ceil(exp - Date.now() / 1000));
}

module.exports = {
  sha256,
  MFA_TOKEN_TYPE,
  VIEW_TOKEN_TYPE,
  signAccessToken,
  signRefreshToken,
  signMfaToken,
  signViewToken,
  verifyAccessToken,
  verifyMfaToken,
  verifyViewToken,
  verifyRefreshToken,
  expiryDateFromToken,
  secondsUntilExpiry,
};
