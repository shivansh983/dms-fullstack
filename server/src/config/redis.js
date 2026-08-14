const Redis = require('ioredis');
const config = require('./env');
const logger = require('../utils/logger');

let ready = false;
let warned = false;

const client = new Redis(config.redis.url, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 500, 10000),
});

client.on('ready', () => {
  ready = true;
  warned = false;
  logger.info('redis connected');
});

client.on('end', () => {
  ready = false;
});

client.on('error', (err) => {
  ready = false;
  if (!warned) {
    warned = true;
    logger.warn(`redis unavailable (${err.message}): token revocation is degraded`);
  }
});

async function connect() {
  if (!config.redis.enabled) {
    logger.warn('redis disabled by REDIS_ENABLED=false');
    return false;
  }
  try {
    await client.connect();
    return true;
  } catch (err) {
    logger.warn(`redis connect failed (${err.message}): continuing without it`);
    return false;
  }
}

async function close() {
  if (client.status !== 'end') {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }
}

module.exports = {
  client,
  connect,
  close,
  isReady: () => config.redis.enabled && ready,
};
