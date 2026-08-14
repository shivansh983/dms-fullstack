const crypto = require('crypto');

const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/pagination');
const fileSignature = require('../utils/fileSignature');
const docRepo = require('../repositories/documentRepository');
const folderRepo = require('../repositories/folderRepository');
const notificationRepo = require('../repositories/notificationRepository');
const storage = require('./storageService');

const STATUSES = ['pending', 'processing', 'approved', 'rejected'];

const asBool = (value) => value === true || value === 'true' || value === '1';

async function assertFolderOwned(folderId, userId) {
  if (!folderId) return null;

  if (!(await folderRepo.exists(folderId, userId))) {
    throw ApiError.notFound('Folder not found');
  }

  return folderId;
}

exports.list = async (userId, query = {}) => {
  const { page, limit, offset } = paginate(query);

  if (query.status && !STATUSES.includes(query.status)) {
    throw ApiError.badRequest('Unknown status filter');
  }

  return docRepo.list({
    userId,
    page,
    limit,
    offset,
    q: query.q?.trim() || null,
    sort: query.sort,
    status: query.status || null,
    folderId: query.folderId || null,
    favoritesOnly: asBool(query.favoritesOnly),
  });
};

exports.get = async (id, userId) => {
  const doc = await docRepo.findById(id, userId);
  if (!doc) throw ApiError.notFound('Document not found');

  return doc;
};

exports.stats = (userId) => docRepo.stats(userId);

exports.versions = async (id, userId) => {
  await exports.get(id, userId);
  return docRepo.listVersions(id);
};

exports.create = async ({ file, meta = {}, userId }) => {
  if (!file) throw ApiError.badRequest('A file is required');

  const trueMime = await fileSignature.assertAllowed(file.buffer, file.mimetype);

  const ext = file.originalname.includes('.')
    ? `.${file.originalname.split('.').pop()}`
    : '';

  const storageKey = `${crypto.randomUUID()}${ext.toLowerCase().slice(0, 10)}`;

  try {
    const folderId = await assertFolderOwned(meta.folderId, userId);

    const tags = meta.tags
      ? String(meta.tags).split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const name = meta.title?.trim() ? `${meta.title.trim()}${ext}` : file.originalname;

    await storage.putObject(storageKey, file.buffer, trueMime);

    const id = await docRepo.createWithVersion({
      name,
      type: trueMime,
      size: file.size,
      storageKey,
      tags,
      folderId,
      userId,
    });

    await notificationRepo.create({
      userId,
      title: 'Upload complete',
      body: `${name} was uploaded and is being processed.`,
      type: 'ocr',
    });

    return docRepo.findById(id, userId);
  } catch (err) {
    await storage.remove(storageKey);
    throw err;
  }
};

exports.updateMeta = async (id, userId, body = {}) => {
  const meta = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) throw ApiError.unprocessable('Document name cannot be empty');
    meta.name = name;
  }

  if (body.isFavorite !== undefined) meta.isFavorite = asBool(body.isFavorite);

  if (body.tags !== undefined) {
    meta.tags = Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean)
      : String(body.tags).split(',').map((t) => t.trim()).filter(Boolean);
  }

  if (body.folderId !== undefined) {
    meta.folderId = body.folderId ? await assertFolderOwned(body.folderId, userId) : null;
  }

  if (!Object.keys(meta).length) throw ApiError.badRequest('Nothing to update');

  const [updated] = await docRepo.updateMeta(id, userId, meta);
  if (!updated) throw ApiError.notFound('Document not found');

  return docRepo.findById(id, userId);
};

exports.move = async (id, userId, folderId) => {
  const target = folderId ? await assertFolderOwned(folderId, userId) : null;

  const [updated] = await docRepo.updateMeta(id, userId, { folderId: target });
  if (!updated) throw ApiError.notFound('Document not found');

  return docRepo.findById(id, userId);
};

exports.remove = async (id, userId) => {
  const doc = await docRepo.findInstance(id, userId);
  if (!doc) throw ApiError.notFound('Document not found');

  const { storageKey } = doc;

  await docRepo.remove(id, userId);
  await storage.remove(storageKey);

  return { ok: true };
};

exports.getDownloadUrl = async (id, userId) => {
  const doc = await docRepo.findStorage(id, userId);
  if (!doc) throw ApiError.notFound('Document not found');

  if (!(await storage.exists(doc.storageKey))) {
    throw ApiError.notFound('The stored file is missing');
  }

  const url = await storage.getDownloadUrl(doc.storageKey, doc.name);

  return {
    url,
    name: doc.name,
    type: doc.type,
    expiresIn: config.s3.urlTtlSeconds,
  };
};
