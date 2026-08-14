const crypto = require('crypto');
const path = require('path');

const config = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const fileSignature = require('../utils/fileSignature');
const uploadRepo = require('../repositories/uploadRepository');
const docRepo = require('../repositories/documentRepository');
const folderRepo = require('../repositories/folderRepository');
const notificationRepo = require('../repositories/notificationRepository');
const storage = require('./storageService');
const quotaService = require('./quotaService');

const parseTags = (raw) => {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  return list.map((t) => String(t).trim()).filter(Boolean);
};

async function assertQuota(userId, size) {
  const { remainingBytes, diskUsableBytes } = await quotaService.summary(userId);

  if (size > remainingBytes) {
    throw new ApiError(
      507,
      `Not enough storage. This file needs ${Math.ceil(size / 1024 / 1024)}MB but only ` +
        `${Math.floor(remainingBytes / 1024 / 1024)}MB of your quota is free.`
    );
  }

  if (diskUsableBytes !== null && size > diskUsableBytes) {
    throw new ApiError(507, 'The server does not have enough disk space for this file.');
  }
}

exports.init = async ({ userId, name, type, size, title, tags, folderId }) => {
  const bytes = Number(size);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    throw ApiError.badRequest('A positive file size is required');
  }

  if (bytes > config.upload.maxFileBytes) {
    throw new ApiError(
      413,
      `Files are limited to ${Math.round(config.upload.maxFileBytes / 1024 / 1024 / 1024)}GB`
    );
  }

  if (!config.upload.allowedMime.includes(type)) {
    throw ApiError.unprocessable('Only PDF, JPG and PNG files are allowed');
  }

  if (folderId && !(await folderRepo.exists(folderId, userId))) {
    throw ApiError.notFound('Folder not found');
  }

  await assertQuota(userId, bytes);

  const chunkSize = config.upload.chunkSize;
  const totalChunks = Math.ceil(bytes / chunkSize);
  const storageKey = `${crypto.randomUUID()}${path.extname(name).toLowerCase().slice(0, 10)}`;

  const multipartUploadId = await storage.createMultipart(storageKey, type);

  const upload = await uploadRepo.create({
    name,
    type,
    size: bytes,
    chunkSize,
    totalChunks,
    storageKey,
    multipartUploadId,
    title: title?.trim() || null,
    tags: parseTags(tags),
    folderId: folderId || null,
    userId,
    expiresAt: new Date(Date.now() + config.upload.ttlHours * 3600 * 1000),
  });

  return {
    uploadId: upload.id,
    chunkSize,
    totalChunks,
    received: [],
  };
};

async function loadPending(id, userId) {
  const upload = await uploadRepo.findOwned(id, userId);
  if (!upload) throw ApiError.notFound('Upload not found');

  if (upload.status !== 'pending') {
    throw ApiError.conflict(`This upload is already ${upload.status}`);
  }

  if (upload.expiresAt.getTime() < Date.now()) {
    throw ApiError.conflict('This upload has expired. Start a new one.');
  }

  return upload;
}

async function readBody(req, limit) {
  const pieces = [];
  let total = 0;

  for await (const piece of req) {
    total += piece.length;

    if (total > limit) {
      throw ApiError.badRequest(`Chunk is larger than the declared ${limit} bytes`);
    }

    pieces.push(piece);
  }

  return Buffer.concat(pieces, total);
}

exports.saveChunk = async ({ id, userId, index, req }) => {
  const upload = await loadPending(id, userId);

  if (!Number.isInteger(index) || index < 0 || index >= upload.totalChunks) {
    throw ApiError.badRequest(`Chunk index must be between 0 and ${upload.totalChunks - 1}`);
  }

  const isLast = index === upload.totalChunks - 1;
  const expected = isLast
    ? Number(upload.size) - index * upload.chunkSize
    : upload.chunkSize;

  const body = await readBody(req, expected);

  if (body.length !== expected) {
    throw ApiError.badRequest(
      `Chunk ${index} should be ${expected} bytes but ${body.length} arrived`
    );
  }

  if (index === 0) {
    await fileSignature.assertAllowed(body, upload.type);
  }

  let etag;

  try {
    etag = await storage.uploadPart({
      key: upload.storageKey,
      uploadId: upload.multipartUploadId,
      partNumber: index + 1,
      body,
    });
  } catch (err) {
    throw new ApiError(502, `Chunk ${index} could not be stored: ${err.message}`);
  }

  await uploadRepo.addPart(upload.id, index, etag);

  const fresh = await uploadRepo.findOwned(id, userId);

  return {
    uploadId: fresh.id,
    received: fresh.receivedChunks.length,
    totalChunks: fresh.totalChunks,
    complete: fresh.receivedChunks.length === fresh.totalChunks,
  };
};

exports.status = async (id, userId) => {
  const upload = await uploadRepo.findOwned(id, userId);
  if (!upload) throw ApiError.notFound('Upload not found');

  return {
    uploadId: upload.id,
    name: upload.name,
    size: Number(upload.size),
    chunkSize: upload.chunkSize,
    totalChunks: upload.totalChunks,
    received: [...upload.receivedChunks].sort((a, b) => a - b),
    missing: upload.missingChunks(),
    status: upload.status,
    expiresAt: upload.expiresAt,
  };
};

exports.complete = async (id, userId) => {
  const upload = await loadPending(id, userId);

  const missing = upload.missingChunks();
  if (missing.length) {
    throw ApiError.badRequest(
      `Cannot finish: ${missing.length} chunk(s) still missing (${missing.slice(0, 10).join(', ')})`
    );
  }

  const finalKey = await storage.completeMultipart({
    key: upload.storageKey,
    uploadId: upload.multipartUploadId,
    parts: upload.parts,
  });

  try {
    const actual = await storage.objectSize(finalKey);

    if (actual !== Number(upload.size)) {
      throw ApiError.badRequest(
        `Assembled file is ${actual} bytes but ${upload.size} was declared`
      );
    }

    const ext = upload.name.includes('.') ? `.${upload.name.split('.').pop()}` : '';
    const name = upload.title ? `${upload.title}${ext}` : upload.name;

    const documentId = await docRepo.createWithVersion({
      name,
      type: upload.type,
      size: Number(upload.size),
      storageKey: finalKey,
      tags: upload.tags,
      folderId: upload.folderId,
      userId,
    });

    await uploadRepo.markCompleted(upload.id);

    await notificationRepo.create({
      userId,
      title: 'Upload complete',
      body: `${name} was uploaded and is being processed.`,
      type: 'ocr',
    });

    return docRepo.findById(documentId, userId);
  } catch (err) {
    await storage.remove(finalKey);
    throw err;
  }
};

exports.abort = async (id, userId) => {
  const upload = await uploadRepo.findOwned(id, userId);
  if (!upload) throw ApiError.notFound('Upload not found');

  if (upload.status === 'pending') {
    await storage.abortMultipart(upload.storageKey, upload.multipartUploadId);
    await uploadRepo.markAborted(upload.id);
  }

  return { ok: true };
};

exports.collectGarbage = async () => {
  const expired = await uploadRepo.findExpired();

  for (const upload of expired) {
    await storage.abortMultipart(upload.storageKey, upload.multipartUploadId);
    await uploadRepo.markAborted(upload.id);
  }

  if (expired.length) {
    logger.info(`cleaned up ${expired.length} expired upload(s)`);
  }

  return expired.length;
};
