const { body, param } = require('express-validator');

const idParam = param('id').isUUID().withMessage('Invalid upload id');

exports.init = [
  body('name').trim().notEmpty().withMessage('File name is required').isLength({ max: 255 }),
  body('type').trim().notEmpty().withMessage('File type is required').isLength({ max: 100 }),
  body('size').isInt({ min: 1 }).withMessage('File size must be a positive integer'),
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title is too long'),
  body('tags').optional().trim().isLength({ max: 500 }).withMessage('Too many tags'),
  body('folderId').optional({ values: 'falsy' }).isUUID().withMessage('Invalid folder id'),
];

exports.byId = [idParam];

exports.chunk = [
  idParam,
  param('index').isInt({ min: 0 }).withMessage('Chunk index must be a non-negative integer'),
];
