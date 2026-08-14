const { client, isReady } = require('../config/redis');
const logger = require('../utils/logger');

const REFRESH_KEY = (hash) => `dms:rt:${hash}`;
const USER_KEY = (userId) => `dms:u:${userId}`;
const DENY_KEY = (jti) => `dms:bl:${jti}`;
const MFA_CODE_KEY = (userId, code) => `dms:mfa:${userId}:${code}`;

async function safe(label, fn, fallback) {
  if (!isReady()) return fallback;
  try {
    return await fn();
  } catch (err) {
    logger.warn(`redis ${label} failed: ${err.message}`);
    return fallback;
  }
}

async function rememberRefresh(tokenHash, userId, ttlSeconds) {
  if (ttlSeconds <= 0) return false;

  return safe('rememberRefresh', async () => {
    await client
      .multi()
      .set(REFRESH_KEY(tokenHash), userId, 'EX', ttlSeconds)
      .sadd(USER_KEY(userId), tokenHash)
      .expire(USER_KEY(userId), ttlSeconds)
      .exec();
    return true;
  }, false);
}

async function lookupRefresh(tokenHash) {
  return safe('lookupRefresh', () => client.get(REFRESH_KEY(tokenHash)), null);
}

async function forgetRefresh(tokenHash) {
  return safe('forgetRefresh', async () => {
    const userId = await client.get(REFRESH_KEY(tokenHash));
    const tx = client.multi().del(REFRESH_KEY(tokenHash));
    if (userId) tx.srem(USER_KEY(userId), tokenHash);
    await tx.exec();
    return true;
  }, false);
}

async function forgetAllForUser(userId) {
  return safe('forgetAllForUser', async () => {
    const hashes = await client.smembers(USER_KEY(userId));
    const tx = client.multi();
    hashes.forEach((hash) => tx.del(REFRESH_KEY(hash)));
    tx.del(USER_KEY(userId));
    await tx.exec();
    return hashes.length;
  }, 0);
}

async function denyAccess(jti, ttlSeconds) {
  if (!jti || ttlSeconds <= 0) return false;

  return safe('denyAccess', async () => {
    await client.set(DENY_KEY(jti), '1', 'EX', ttlSeconds);
    return true;
  }, false);
}

async function isAccessDenied(jti) {
  if (!jti) return false;

  return safe(
    'isAccessDenied',
    async () => (await client.exists(DENY_KEY(jti))) === 1,
    false
  );
}

async function consumeMfaCode(userId, code, ttlSeconds) {
  return safe(
    'consumeMfaCode',
    async () => (await client.set(MFA_CODE_KEY(userId, code), '1', 'EX', ttlSeconds, 'NX')) === 'OK',
    true
  );
}

module.exports = {
  rememberRefresh,
  lookupRefresh,
  forgetRefresh,
  forgetAllForUser,
  denyAccess,
  isAccessDenied,
  consumeMfaCode,
};
