require('dotenv').config();

const speakeasy = require('speakeasy');

const emailService = require('../src/services/emailService');

let capturedResetLink = null;
emailService.sendPasswordReset = async (to, link) => {
  capturedResetLink = link;
  return true;
};
emailService.sendPasswordChanged = async () => true;

const authService = require('../src/services/authService');
const userRepo = require('../src/repositories/userRepository');
const redis = require('../src/config/redis');
const { sequelize, User } = require('../src/models');

const stamp = Date.now();
const mfaEmail = `mfa${stamp}@example.com`;
const resetEmail = `reset${stamp}@example.com`;
const PASSWORD = 'OriginalPass123!';
const NEW_PASSWORD = 'BrandNewPass456!';

const results = [];
function check(label, passed, detail) {
  results.push({ label, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
}

function totp(secret) {
  return speakeasy.totp({ secret, encoding: 'base32' });
}

async function testMfa() {
  console.log('\n--- 2FA / MFA FLOW ---');

  await authService.register({ name: 'Mfa User', email: mfaEmail, password: PASSWORD });
  const first = await authService.login({ email: mfaEmail, password: PASSWORD });
  check('login before MFA returns tokens', !!first.accessToken && !first.mfaRequired);

  const user = await userRepo.findByEmail(mfaEmail);
  const setup = await authService.beginMfaSetup(user.id);
  check('mfa/setup returns secret + QR', !!setup.secret && setup.qrDataUrl.startsWith('data:image'));

  try {
    await authService.confirmMfaSetup(user.id, '000000');
    check('mfa/confirm rejects wrong code', false, 'it accepted 000000');
  } catch (e) {
    check('mfa/confirm rejects wrong code', e.status === 400, e.message);
  }

  const confirmed = await authService.confirmMfaSetup(user.id, totp(setup.secret));
  check('mfa/confirm accepts valid code', confirmed.mfaEnabled === true);

  const gated = await authService.login({ email: mfaEmail, password: PASSWORD });
  check('login now demands MFA (no tokens leaked)', gated.mfaRequired === true && !gated.accessToken);
  check('login returns tempToken', !!gated.tempToken);

  const code = totp(setup.secret);
  const verified = await authService.verifyMfa({ tempToken: gated.tempToken, code });
  check('mfa/verify exchanges tempToken for real tokens', !!verified.accessToken && !!verified.refreshToken);

  try {
    await authService.verifyMfa({ tempToken: gated.tempToken, code });
    check('mfa/verify blocks code REPLAY', false, 'same code accepted twice (is redis up?)');
  } catch (e) {
    check('mfa/verify blocks code REPLAY', e.status === 401, e.message);
  }

  try {
    await authService.verifyMfa({ tempToken: 'garbage.token.here', code: totp(setup.secret) });
    check('mfa/verify rejects bad tempToken', false, 'accepted garbage');
  } catch (e) {
    check('mfa/verify rejects bad tempToken', e.status === 401, e.message);
  }
}

async function testSsoSetPassword() {
  console.log('\n--- SSO USER CREATES A PASSWORD ---');

  const ssoEmail = `sso${stamp}@example.com`;
  const chosen = 'ChosenPass123!';

  const user = await userRepo.createFromGoogle({
    name: 'Sso User',
    email: ssoEmail,
    googleId: `sub-${stamp}`,
  });

  const fresh = await userRepo.findByIdWithPassword(user.id);
  check('new SSO user starts with no password', !fresh.password);

  capturedResetLink = null;
  await authService.forgotPassword({ email: ssoEmail });
  check('SSO user cannot use forgot-password yet', capturedResetLink === null);

  const created = await authService.setPassword(user.id, chosen);
  check('set-password succeeds for SSO user', created.hasPassword === true);

  const login = await authService.login({ email: ssoEmail, password: chosen });
  check('SSO user can now log in with password', !!login.accessToken);
  check('login reports hasPassword true', login.user.hasPassword === true);

  try {
    await authService.setPassword(user.id, 'Another123!');
    check('set-password blocked once one exists', false, 'a second password was accepted');
  } catch (e) {
    check('set-password blocked once one exists', e.status === 409, e.message);
  }

  capturedResetLink = null;
  await authService.forgotPassword({ email: ssoEmail });
  check('forgot-password now works for that user', !!capturedResetLink);

  await User.destroy({ where: { email: ssoEmail } });
}

async function testForgotPassword() {
  console.log('\n--- FORGOT / RESET PASSWORD FLOW ---');

  await authService.register({ name: 'Reset User', email: resetEmail, password: PASSWORD });

  const unknown = await authService.forgotPassword({ email: 'does-not-exist@example.com' });
  check('forgot-password does not leak unknown emails', /If that email exists/.test(unknown.message));

  capturedResetLink = null;
  await authService.forgotPassword({ email: resetEmail });
  check('forgot-password generated a reset link', !!capturedResetLink, capturedResetLink);

  const token = new URL(capturedResetLink).searchParams.get('token');
  check('reset link carries a 64-char token', !!token && token.length === 64);

  try {
    await authService.resetPassword({ token: 'wrong-token', newPassword: NEW_PASSWORD });
    check('reset rejects invalid token', false, 'accepted a bogus token');
  } catch (e) {
    check('reset rejects invalid token', e.status === 400, e.message);
  }

  const done = await authService.resetPassword({ token, newPassword: NEW_PASSWORD });
  check('reset with valid token succeeds', /Password updated/.test(done.message));

  try {
    await authService.resetPassword({ token, newPassword: 'ThirdPass789!' });
    check('reset token is SINGLE-USE', false, 'token reused successfully');
  } catch (e) {
    check('reset token is SINGLE-USE', e.status === 400, e.message);
  }

  try {
    await authService.login({ email: resetEmail, password: PASSWORD });
    check('old password no longer works', false, 'old password still valid');
  } catch (e) {
    check('old password no longer works', e.status === 401, e.message);
  }

  const relogin = await authService.login({ email: resetEmail, password: NEW_PASSWORD });
  check('login with NEW password works', !!relogin.accessToken);
}

(async () => {
  try {
    const redisUp = await redis.connect();
    check('redis connected (required for replay protection)', redisUp);

    await testMfa();
    await testSsoSetPassword();
    await testForgotPassword();
  } catch (err) {
    console.error('\nUNEXPECTED ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await User.destroy({ where: { email: [mfaEmail, resetEmail] } });
    await sequelize.close();
    await redis.close();

    const failed = results.filter((r) => !r.passed);
    console.log(`\n===== ${results.length - failed.length}/${results.length} checks passed =====`);
    if (failed.length) {
      console.log('FAILED:');
      failed.forEach((f) => console.log(`  - ${f.label}: ${f.detail || ''}`));
    }
    process.exit(failed.length ? 1 : 0);
  }
})();
