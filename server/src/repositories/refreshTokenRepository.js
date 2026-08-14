const { Op } = require('sequelize');
const { RefreshToken } = require('../models');

module.exports = {
  create: ({ tokenHash, userId, expiresAt }) =>
    RefreshToken.create({ tokenHash, userId, expiresAt }),

  findActive: (tokenHash) =>
    RefreshToken.findOne({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    }),

  revoke: (tokenHash) =>
    RefreshToken.update({ revokedAt: new Date() }, { where: { tokenHash } }),

  revokeAllForUser: (userId) =>
    RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: null } }
    ),

  deleteExpired: () =>
    RefreshToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } }),
};
