const { body } = require('express-validator');

exports.register = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name is too long'),

  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 128 }).withMessage('Password is too long'),
];

exports.login = [
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

exports.refresh = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),
];

const mfaCode = body('code')
  .trim()
  .isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code')
  .isNumeric().withMessage('The code is 6 digits');

exports.mfaConfirm = [mfaCode];

exports.mfaDisable = [mfaCode];

exports.mfaVerify = [
  body('tempToken')
    .notEmpty().withMessage('Two-factor session expired. Sign in again.'),

  mfaCode,
];

exports.setPassword = [
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 128 }).withMessage('Password is too long'),
];

exports.forgotPassword = [
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address'),
];

exports.resetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 128 }).withMessage('Password is too long'),
];
