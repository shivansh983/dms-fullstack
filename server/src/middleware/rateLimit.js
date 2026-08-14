const rateLimit = require('express-rate-limit');

const config = require('../config/env');

const credentialLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.credentialMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { message: 'Too many attempts. Try again later.' },
});

module.exports = { credentialLimiter };
