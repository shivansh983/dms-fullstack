const ApiError = require('../utils/ApiError');

module.exports = (...allowed) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));

  if (!allowed.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to do that'));
  }

  next();
};
