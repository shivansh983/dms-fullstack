const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

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

exports.logout = asyncHandler(async (req, res) => {
  res.json(
    await authService.logout({
      refreshToken: req.body?.refreshToken,
      accessToken: bearerToken(req),
    })
  );
});