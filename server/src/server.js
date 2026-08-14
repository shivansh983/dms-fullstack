const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const redis = require('./config/redis');
const storage = require('./services/storageService');
const chunkedUpload = require('./services/chunkedUploadService');
const { sequelize } = require('./models');

const GC_INTERVAL_MS = 60 * 60 * 1000;

let server;
let gcTimer;

async function assertMigrated() {
  const [rows] = await sequelize.query(
    `SELECT to_regclass('public."SequelizeMeta"') IS NOT nuLL AS migrated`
  );

  if (!rows[0]?.migrated) {
    throw new Error(
      'Database has no migration history. Run "npm run db:migrate" before starting.'
    );
  }
}

async function start() {
  await sequelize.authenticate();
  logger.info(' database connected');

  await assertMigrated();
  logger.info(' schema managed by migrations');

  await redis.connect();

  await storage.ensureBucket();
  logger.info(`object storage ready (bucket: ${config.s3.bucket})`);

  await chunkedUpload.collectGarbage();
  gcTimer = setInterval(() => {
    chunkedUpload.collectGarbage().catch((err) => logger.error('upload GC failed', err));
  }, GC_INTERVAL_MS);
  gcTimer.unref();

  server = app.listen(config.port, () => {
    logger.info(`listening on http://localhost:${config.port}/api [${config.env}]`);
  });
}

function shutdown(signal) {
  return async () => {
    logger.info(`${signal} received, shutting down`);
    try {
      if (gcTimer) clearInterval(gcTimer);
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
      await redis.close();
      await sequelize.close();
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
  };
}

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, shutdown(signal)));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

start().catch((err) => {
  logger.error(' failed to start:', err.message);
  process.exit(1);
});
