const router = require('express').Router();

const ctrl = require('../controllers/authController');
const rules = require('../validations/authValidation');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { credentialLimiter } = require('../middleware/rateLimit');

router.post('/register', credentialLimiter, rules.register, validate, ctrl.register);
router.post('/login', credentialLimiter, rules.login, validate, ctrl.login);
router.post('/refresh', rules.refresh, validate, ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/sso/google', credentialLimiter, ctrl.googleLogin);

router.post('/mfa/setup', authenticate, ctrl.mfaSetup);
router.post('/mfa/confirm', credentialLimiter, authenticate, rules.mfaConfirm, validate, ctrl.mfaConfirm);
router.post('/mfa/verify', credentialLimiter, rules.mfaVerify, validate, ctrl.mfaVerify);
router.post('/mfa/disable', credentialLimiter, authenticate, rules.mfaDisable, validate, ctrl.mfaDisable);

router.post('/set-password', authenticate, rules.setPassword, validate, ctrl.setPassword);

router.post('/forgot-password', credentialLimiter, rules.forgotPassword, validate, ctrl.forgotPassword);

router.get('/reset-password', ctrl.resetRedirect);
router.post('/reset-password', credentialLimiter, rules.resetPassword, validate, ctrl.resetPassword);

module.exports = router;
