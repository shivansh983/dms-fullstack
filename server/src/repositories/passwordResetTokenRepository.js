const { Op } = require('sequelize');
const { PasswordResetToken } = require('../models');

module.exports = {
  create: ({ tokenHash, userId, expiresAt }) =>
    PasswordResetToken.create({ tokenHash, userId, expiresAt }),

  findValid: (tokenHash) =>
    PasswordResetToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    }),

  consume: (id) =>
    PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { id, usedAt: null } }
    ),

  invalidateAllForUser: (userId) =>
    PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { userId, usedAt: null } }
    ),

  deleteExpired: () =>
    PasswordResetToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } }),
};
