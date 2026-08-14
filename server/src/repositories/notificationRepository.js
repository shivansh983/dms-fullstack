const { Notification } = require('../models');

const LIST_ATTRS = ['id', 'title', 'body', 'type', 'read', 'createdAt'];

exports.list = (userId, limit = 50) =>
  Notification.findAll({
    where: { userId },
    attributes: LIST_ATTRS,
    order: [['createdAt', 'DESC']],
    limit,
    raw: true,
  });

exports.unreadCount = (userId) =>
  Notification.count({ where: { userId, read: false } });

exports.markRead = (id, userId) =>
  Notification.update({ read: true }, { where: { id, userId, read: false } });

exports.markAllRead = (userId) =>
  Notification.update({ read: true }, { where: { userId, read: false } });

exports.create = ({ userId, title, body, type }, options = {}) =>
  Notification.create({ userId, title, body, type }, options);
