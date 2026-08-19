const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const required = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'S3_BUCKET',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

const env = process.env.NODE_ENV || 'development';

const MIN_PART_BYTES = 5 * 1024 * 1024;

const chunkSize = (Number(process.env.UPLOAD_CHUNK_MB) || 5) * 1024 * 1024;

if (chunkSize < MIN_PART_BYTES) {
  throw new Error(
    `UPLOAD_CHUNK_MB must be at least 5 : S3 multipart rejects parts smaller than 5MB`
  );
}

module.exports = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: Number(process.env.PORT) || 8000,
  trustProxy: Number(process.env.TRUST_PROXY) || 0,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  mfa: {
    issuer: process.env.MFA_ISSUER || 'DMS',
    secretBytes: Number(process.env.MFA_SECRET_BYTES) || 20,
    window: Number(process.env.MFA_WINDOW) || 1,
    tempTokenExpires: process.env.MFA_TEMP_TOKEN_EXPIRES || '5m',
  },

  rateLimit: {
    windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
    credentialMax: Number(process.env.RATE_LIMIT_CREDENTIAL_MAX) || 10,
  },

  redis: {
    url: process.env.REDIS_URL,
    enabled: process.env.REDIS_ENABLED !== 'false',
  },

  upload: {
    dir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR ),
    tmpDir: path.resolve(__dirname, '../../', process.env.UPLOAD_DIR , 'tmp'),
    maxBytes: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024,
    allowedMime: ['application/pdf', 'image/jpeg', 'image/png'],

    chunkSize,
    maxFileBytes: (Number(process.env.MAX_FILE_GB) || 2) * 1024 * 1024 * 1024,
    ttlHours: Number(process.env.UPLOAD_TTL_HOURS) || 24,
  },

  storage: {
    quotaBytes: (Number(process.env.STORAGE_QUOTA_GB) || 5) * 1024 * 1024 * 1024,
    diskHeadroomRatio: 0.2,
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || null,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || null,
    region: process.env.S3_REGION || 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY || null,
    secretKey: process.env.S3_SECRET_KEY || null,
    bucket: process.env.S3_BUCKET,
    urlTtlSeconds: Number(process.env.S3_URL_TTL) || 300,
    autoCreateBucket: Boolean(process.env.S3_ENDPOINT),
  },

  google: {
  clientId: process.env.GOOGLE_CLIENT_ID,
},

  app: {
    url: process.env.APP_URL || 'http://localhost:8000',
  },

  email: {
    from: process.env.EMAIL_FROM || 'DMS <no-reply@dms.local>',
    smtp: {
      host: process.env.SMTP_HOST || null,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      user: process.env.SMTP_USER || null,
      password: process.env.SMTP_PASSWORD || null,
    },
  },

  passwordReset: {
    ttlMinutes: Number(process.env.PASSWORD_RESET_TTL_MIN) || 15,
    linkBase: process.env.PASSWORD_RESET_LINK_BASE || 'dmsapp://reset-password',
  },

};
