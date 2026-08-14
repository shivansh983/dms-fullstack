const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

exports.list = asyncHandler(async (req, res) => {
  res.json(await notificationService.list(req.user.id));
});

exports.markRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markRead(req.params.id, req.user.id));
});

exports.markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user.id));
});
