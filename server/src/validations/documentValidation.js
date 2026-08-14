const { body, param, query } = require('express-validator');

const SORTS = ['createdAt:desc', 'createdAt:asc', 'name:asc', 'size:desc'];
const STATUSES = ['pending', 'processing', 'approved', 'rejected'];

const idParam = param('id').isUUID().withMessage('Invalid document id');

exports.list = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sort').optional().isIn(SORTS).withMessage('Unsupported sort option'),
  query('status').optional().isIn(STATUSES).withMessage('Unknown status filter'),
  query('folderId').optional().isUUID().withMessage('Invalid folder id'),
  query('q').optional().trim().isLength({ max: 200 }).withMessage('Search term is too long'),
];

exports.byId = [idParam];

exports.create = [
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title is too long'),
  body('tags').optional().trim().isLength({ max: 500 }).withMessage('Too many tags'),
  body('folderId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid folder id'),
];

exports.updateMeta = [
  idParam,
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Invalid document name'),
  body('isFavorite').optional().isBoolean().withMessage('isFavorite must be true or false'),
  body('folderId').optional({ values: 'null' }).isUUID().withMessage('Invalid folder id'),
];

exports.move = [
  idParam,

  body('folderId').optional({ values: 'null' }).isUUID().withMessage('Invalid folder id'),
];
