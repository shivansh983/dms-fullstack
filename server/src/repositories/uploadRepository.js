const { Op } = require('sequelize');

const { sequelize, Upload } = require('../models');

exports.create = (fields) => Upload.create(fields);

exports.findOwned = (id, userId) => Upload.findOne({ where: { id, userId } });


exports.addPart = async (id, index, etag) => {
  const [, affected] = await sequelize.query(
    `UPDATE uploads
        SET received_chunks = array_append(received_chunks, :index),
            parts = parts || :part::jsonb,
            updated_at = NOW()
      WHERE id = :id
        AND status = 'pending'
        AND NOT (:index = ANY(received_chunks))`,
    {
      replacements: {
        id,
        index,
        part: JSON.stringify([{ PartNumber: index + 1, ETag: etag }]),
      },
    }
  );

  return affected;
};

exports.markCompleted = (id) =>
  Upload.update({ status: 'completed' }, { where: { id, status: 'pending' } });

exports.markAborted = (id) =>
  Upload.update({ status: 'aborted' }, { where: { id, status: 'pending' } });

exports.remove = (id) => Upload.destroy({ where: { id } });

exports.findExpired = (limit = 100) =>
  Upload.findAll({
    where: { status: 'pending', expiresAt: { [Op.lt]: new Date() } },
    limit,
  });

exports.listPending = (userId) =>
  Upload.findAll({
    where: { userId, status: 'pending' },
    attributes: ['id', 'name', 'size', 'chunkSize', 'totalChunks', 'receivedChunks', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });

exports.usage = async (userId) => {
  const [stored] = await sequelize.query(
    `SELECT COALESCE(SUM(size), 0)::bigint AS bytes FROM documents WHERE user_id = :userId`,
    { replacements: { userId } }
  );

  const [reserved] = await sequelize.query(
    `SELECT COALESCE(SUM(size), 0)::bigint AS bytes
       FROM uploads
      WHERE user_id = :userId AND status = 'pending' AND expires_at > NOW()`,
    { replacements: { userId } }
  );

  return {
    storedBytes: Number(stored[0].bytes),
    reservedBytes: Number(reserved[0].bytes),
  };
};
