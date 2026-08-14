const asyncHandler = require('../utils/asyncHandler');
const folderService = require('../services/folderService');

exports.list = asyncHandler(async (req, res) => {
  res.json(await folderService.list(req.user.id));
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await folderService.create(req.user.id, req.body.name));
});

exports.rename = asyncHandler(async (req, res) => {
  res.json(await folderService.rename(req.params.id, req.user.id, req.body.name));
});

exports.remove = asyncHandler(async (req, res) => {
  res.json(await folderService.remove(req.params.id, req.user.id));
});
