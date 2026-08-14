const { User } = require('../models');

module.exports = {
  findByEmail: (email) => User.findOne({ where: { email: email.toLowerCase() } }),

  findByEmailWithPassword: (email) =>
    User.scope('withPassword').findOne({ where: { email: email.toLowerCase() } }),

  findById: (id) => User.findByPk(id),

  findByIdWithPassword: (id) => User.scope('withPassword').findByPk(id),

  findByIdWithMfa: (id) => User.scope('withMfa').findByPk(id),

  create: ({ name, email, password, role }) =>
    User.create({ name, email: email.toLowerCase(), password, role }),

  createFromGoogle: ({ name, email, googleId }) =>
    User.create({ name, email: email.toLowerCase(), googleId, role: 'user' }),

  setPendingMfaSecret: (id, secret) =>
    User.update({ pendingMfaSecret: secret }, { where: { id } }),

  enableMfa: (id, secret) =>
    User.update(
      { mfaEnabled: true, mfaSecret: secret, pendingMfaSecret: null },
      { where: { id } }
    ),

  disableMfa: (id) =>
    User.update(
      { mfaEnabled: false, mfaSecret: null, pendingMfaSecret: null },
      { where: { id } }
    ),
};
