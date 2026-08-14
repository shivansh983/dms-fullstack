const config = require('../config/env');

const stamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${stamp()}] INFO `, ...args),
  warn: (...args) => console.warn(`[${stamp()}] WARN `, ...args),
  error: (...args) => console.error(`[${stamp()}] ERROR`, ...args),

  debug: (...args) => {
    if (config.env === 'development') console.log(`[${stamp()}] DEBUG`, ...args);
  },
};

module.exports = logger;
