const { body, param } = require('express-validator');

const idParam = param('id').isUUID().withMessage('Invalid folder id');

const nameRule = body('name')
  .trim()
  .notEmpty().withMessage('Folder name is required')
  .isLength({ max: 120 }).withMessage('Folder name is too long');

exports.create = [nameRule];
exports.rename = [idParam, nameRule];
exports.byId = [idParam];
