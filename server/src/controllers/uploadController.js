const asyncHandler = require('../utils/asyncHandler');
const chunkedUpload = require('../services/chunkedUploadService');

exports.init = asyncHandler(async (req, res) => {
  const session = await chunkedUpload.init({
    userId: req.user.id,
    name: req.body.name,
    type: req.body.type,
    size: req.body.size,
    title: req.body.title,
    tags: req.body.tags,
    folderId: req.body.folderId,
  });

  res.status(201).json(session);
});

exports.chunk = asyncHandler(async (req, res) => {
  const result = await chunkedUpload.saveChunk({
    id: req.params.id,
    userId: req.user.id,
    index: Number(req.params.index),
    req,
  });

  res.json(result);
});

exports.status = asyncHandler(async (req, res) => {
  res.json(await chunkedUpload.status(req.params.id, req.user.id));
});

exports.complete = asyncHandler(async (req, res) => {
  res.status(201).json(await chunkedUpload.complete(req.params.id, req.user.id));
});

exports.abort = asyncHandler(async (req, res) => {
  res.json(await chunkedUpload.abort(req.params.id, req.user.id));
});
