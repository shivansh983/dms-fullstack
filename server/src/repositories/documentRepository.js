const { Op, fn, col, literal } = require('sequelize');

const { sequelize, Document, DocumentVersion, User, Folder } = require('../models');

const SORTS = {
  'createdAt:desc': [['createdAt', 'DESC']],
  'createdAt:asc': [['createdAt', 'ASC']],
  'name:asc': [['name', 'ASC']],
  'size:desc': [['size', 'DESC']],
};

const DEFAULT_SORT = 'createdAt:desc';

const LIST_ATTRS = [
  'id',
  'name',
  'type',
  'size',
  'status',
  'folderId',
  'isFavorite',
  'createdAt',
  'version',
  'tags',
];

const DETAIL_ATTRS = [...LIST_ATTRS, 'content', 'ocrConfidence'];

const toListItem = ({ owner, ...doc }) => ({
  ...doc,
  size: Number(doc.size),
  ownerName: owner?.name ?? null,
});

function buildWhere({ userId, q, status, folderId, favoritesOnly }) {
  const where = { userId };

  if (status) where.status = status;
  if (folderId) where.folderId = folderId;
  if (favoritesOnly) where.isFavorite = true;

  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { content: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return where;
}

exports.list = async ({ userId, page, limit, offset, q, sort, status, folderId, favoritesOnly }) => {
  const { rows, count } = await Document.findAndCountAll({
    where: buildWhere({ userId, q, status, folderId, favoritesOnly }),
    attributes: LIST_ATTRS,

    include: [{ model: User, as: 'owner', attributes: ['name'] }],

    order: SORTS[sort] || SORTS[DEFAULT_SORT],
    limit,
    offset,

    raw: true,
    nest: true,
  });

  return {
    items: rows.map(toListItem),
    total: count,
    page,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

exports.findById = async (id, userId) => {
  const doc = await Document.findOne({
    where: { id, userId },

    attributes: DETAIL_ATTRS,
    include: [
      { model: User, as: 'owner', attributes: ['name'] },
      { model: Folder, as: 'folder', attributes: ['id', 'name'] },
    ],
    raw: true,
    nest: true,
  });

  if (!doc) return null;

  const { owner, folder, ...rest } = doc;

  return {
    ...rest,
    size: Number(rest.size),
    ownerName: owner?.name ?? null,

    folder: folder?.id ? folder : null,
  };
};

exports.findStorage = (id, userId) =>
  Document.findOne({
    where: { id, userId },
    attributes: ['storageKey', 'name', 'type'],
    raw: true,
  });

exports.findInstance = (id, userId) => Document.findOne({ where: { id, userId } });

exports.findAnyInstance = (id) => Document.findByPk(id);

exports.createWithVersion = async ({ name, type, size, storageKey, tags, folderId, userId }) =>
  sequelize.transaction(async (t) => {
    const doc = await Document.create(
      {
        name,
        type,
        size,
        storageKey,
        tags,
        folderId: folderId || null,
        userId,
        status: 'processing',
        version: 1,
      },
      { transaction: t }
    );

    await DocumentVersion.create(
      { documentId: doc.id, version: 1, size, storageKey, createdBy: userId },
      { transaction: t }
    );

    return doc.id;
  });

exports.updateMeta = (id, userId, meta) =>
  Document.update(meta, { where: { id, userId } });

exports.remove = (id, userId) => Document.destroy({ where: { id, userId } });

exports.listVersions = async (documentId) => {
  const rows = await DocumentVersion.findAll({
    where: { documentId },
    attributes: ['version', 'size', 'createdAt'],
    include: [{ model: User, as: 'author', attributes: ['name'] }],
    order: [['version', 'DESC']],
    raw: true,
    nest: true,
  });

  return rows.map(({ author, ...v }) => ({
    ...v,
    size: Number(v.size),
    author: author?.name ?? null,
  }));
};

exports.stats = async (userId) => {
  const countIf = (condition) => fn('COUNT', literal(`CASE WHEN ${condition} THEN 1 END`));

  const row = await Document.findOne({
    where: { userId },
    attributes: [
      [fn('COUNT', col('id')), 'total'],
      [countIf(`status = 'pending'`), 'pending'],
      [countIf(`status = 'processing'`), 'processing'],
      [countIf(`status = 'approved'`), 'approved'],
      [countIf(`status = 'rejected'`), 'rejected'],
      [countIf(`is_favorite = true`), 'favorites'],
      [fn('COALESCE', fn('SUM', col('size')), 0), 'storageBytes'],
    ],
    raw: true,
  });

  return {
    total: Number(row.total),
    pending: Number(row.pending),
    processing: Number(row.processing),
    approved: Number(row.approved),
    rejected: Number(row.rejected),
    favorites: Number(row.favorites),
    storageBytes: Number(row.storageBytes),
  };
};

exports.saveExtractedText = (id, { content, ocrConfidence }) =>
  Document.update({ content, ocrConfidence, status: 'pending' }, { where: { id } });

exports.findProcessing = () =>
  Document.findAll({
    where: { status: 'processing' },
    attributes: ['id', 'name', 'type', 'storageKey', 'userId'],
    raw: true,
  });
