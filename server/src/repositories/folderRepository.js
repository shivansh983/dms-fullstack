const { literal } = require('sequelize');

const { Folder } = require('../models');

const DOCUMENT_COUNT = literal(
  '(SELECT COUNT(*)::int FROM "documents" AS d WHERE d.folder_id = "Folder"."id")'
);

exports.list = (userId) =>
  Folder.findAll({
    where: { userId },
    attributes: ['id', 'name', 'createdAt', [DOCUMENT_COUNT, 'documentCount']],
    order: [['createdAt', 'DESC']],
    raw: true,
  });

exports.findById = (id, userId) =>
  Folder.findOne({
    where: { id, userId },
    attributes: ['id', 'name', 'createdAt', [DOCUMENT_COUNT, 'documentCount']],
    raw: true,
  });

exports.findByName = (name, userId) =>
  Folder.findOne({ where: { name, userId } });

exports.create = (name, userId) => Folder.create({ name, userId });

exports.rename = (id, userId, name) =>
  Folder.update({ name }, { where: { id, userId } });

exports.remove = (id, userId) => Folder.destroy({ where: { id, userId } });

exports.exists = async (id, userId) =>
  (await Folder.count({ where: { id, userId } })) > 0;
