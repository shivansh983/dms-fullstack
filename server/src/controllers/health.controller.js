const sequelize = require('../config/database');
const redis = require('../config/redis');
const config = require('../config/env');

exports.health = async (req, res) => {
  let database = 'up';
  try {
    await sequelize.authenticate();
  } catch {
    database = 'down';
  }

  let cache = 'disabled';
  if (config.redis.enabled) {
    cache = redis.isReady() ? 'up' : 'down';
  }

  res.status(database === 'up' ? 200 : 503).json({
    ok: database === 'up',
    database,
    cache,
    at: new Date().toISOString(),
  });
};
