const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'That email is already registered';
  } else if (err.name === 'SequelizeValidationError') {
    status = 422;
    message = err.errors.map((e) => e.message).join(', ');
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 409;
    message = 'That record is still referenced by something else';
  } else if (err.name === 'SequelizeDatabaseError') {
    status = 500;
    message = 'Database error';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Session expired. Please sign in again.';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.name === 'MulterError') {
    status = 413;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File is too large (max ${Math.round(config.upload.maxBytes / 1024 / 1024)}MB)`
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Upload one file at a time, in a field named "file"'
          : 'Upload failed';
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
  }

  if (status >= 500 && config.isProduction) {
    message = 'Something went wrong';
  }

  res.status(status).json({
    message,
    ...(config.env === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
