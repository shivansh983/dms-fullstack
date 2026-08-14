const notificationRepo = require('../repositories/notificationRepository');

exports.list = async (userId) => {
  const [items, unreadCount] = await Promise.all([
    notificationRepo.list(userId),
    notificationRepo.unreadCount(userId),
  ]);

  return { items, unreadCount };
};

exports.markRead = async (id, userId) => {
  await notificationRepo.markRead(id, userId);
  return { ok: true };
};

exports.markAllRead = async (userId) => {
  await notificationRepo.markAllRead(userId);
  return { ok: true };
};
