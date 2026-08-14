const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const tokens = require('../services/tokenService');
const tokenCache = require('../repositories/tokenCache');

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const token = header.slice(7).trim();
  if (!token) return next(ApiError.unauthorized('Authentication required'));

  const payload = tokens.verifyAccessToken(token);

  if (payload.typ === tokens.MFA_TOKEN_TYPE) {
    return next(ApiError.unauthorized('Finish the two-factor step first'));
  }

  if (await tokenCache.isAccessDenied(payload.jti)) {
    return next(ApiError.unauthorized('Session ended. Please sign in again.'));
  }

  req.user = { id: payload.sub, role: payload.role, jti: payload.jti };

  next();
});
