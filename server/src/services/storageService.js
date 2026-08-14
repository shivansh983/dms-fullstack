const path = require('path');
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const config = require('../config/env');
const logger = require('../utils/logger');

const BUCKET = config.s3.bucket;

function buildClient(endpoint) {
  const options = { region: config.s3.region };

  if (endpoint) {
    options.endpoint = endpoint;
    options.forcePathStyle = true;
  }

  if (config.s3.accessKey && config.s3.secretKey) {
    options.credentials = {
      accessKeyId: config.s3.accessKey,
      secretAccessKey: config.s3.secretKey,
    };
  }

  return new S3Client(options);
}

const s3 = buildClient(config.s3.endpoint);

const signer =
  config.s3.publicEndpoint === config.s3.endpoint
    ? s3
    : buildClient(config.s3.publicEndpoint);

function safeKey(key) {
  const clean = path
    .normalize(key)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/\\/g, '/');

  if (clean.includes('..')) {
    throw new Error(`Refusing to use unsafe key: ${key}`);
  }

  return clean;
}

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return;
  } catch (err) {
    if (!config.s3.autoCreateBucket) {
      throw new Error(`Bucket "${BUCKET}" is not reachable: ${err.name}`);
    }
  }

  await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  logger.info(`created bucket ${BUCKET}`);
}

async function createMultipart(key, contentType) {
  const res = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: safeKey(key),
      ContentType: contentType,
    })
  );

  return res.UploadId;
}

async function uploadPart({ key, uploadId, partNumber, body }) {
  const res = await s3.send(
    new UploadPartCommand({
      Bucket: BUCKET,
      Key: safeKey(key),
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
      ContentLength: body.length,
    })
  );

  return res.ETag;
}

async function completeMultipart({ key, uploadId, parts }) {
  const safe = safeKey(key);

  const ordered = [...parts]
    .sort((a, b) => a.PartNumber - b.PartNumber)
    .map(({ PartNumber, ETag }) => ({ PartNumber, ETag }));

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: safe,
      UploadId: uploadId,
      MultipartUpload: { Parts: ordered },
    })
  );

  return safe;
}

async function abortMultipart(key, uploadId) {
  if (!uploadId) return;

  try {
    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: BUCKET,
        Key: safeKey(key),
        UploadId: uploadId,
      })
    );
  } catch (err) {
    logger.error(`Failed to abort multipart upload for ${key}`, err);
  }
}

async function putObject(key, body, contentType) {
  const safe = safeKey(key);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: safe,
      Body: body,
      ContentType: contentType,
    })
  );

  return safe;
}

async function objectSize(key) {
  const res = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: safeKey(key) }));
  return Number(res.ContentLength);
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: safeKey(key) }));
    return true;
  } catch {
    return false;
  }
}

async function getDownloadUrl(key, filename) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: safeKey(key),
    ResponseContentDisposition: filename
      ? `attachment; filename="${filename.replace(/"/g, '')}"`
      : undefined,
  });

  return getSignedUrl(signer, command, { expiresIn: config.s3.urlTtlSeconds });
}

async function remove(key) {
  if (!key) return;

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: safeKey(key) }));
  } catch (err) {
    logger.error(`Failed to delete ${key}`, err);
  }
}

module.exports = {
  s3,
  ensureBucket,
  createMultipart,
  uploadPart,
  completeMultipart,
  abortMultipart,
  putObject,
  objectSize,
  exists,
  getDownloadUrl,
  remove,
};
