const { pipeline } = require('stream/promises');

const asyncHandler = require('../utils/asyncHandler');
const documentService = require('../services/documentService');

exports.list = asyncHandler(async (req, res) => {
  res.json(await documentService.list(req.user.id, req.query));
});

exports.stats = asyncHandler(async (req, res) => {
  res.json(await documentService.stats(req.user.id));
});

exports.getById = asyncHandler(async (req, res) => {
  res.json(await documentService.get(req.params.id, req.user.id));
});

exports.versions = asyncHandler(async (req, res) => {
  res.json(await documentService.versions(req.params.id, req.user.id));
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await documentService.create({
    file: req.file,
    meta: req.body,
    userId: req.user.id,
  });

  res.status(201).json(doc);
});

exports.updateMeta = asyncHandler(async (req, res) => {
  res.json(await documentService.updateMeta(req.params.id, req.user.id, req.body));
});

exports.move = asyncHandler(async (req, res) => {
  res.json(await documentService.move(req.params.id, req.user.id, req.body.folderId));
});

exports.remove = asyncHandler(async (req, res) => {
  res.json(await documentService.remove(req.params.id, req.user.id));
});

exports.download = asyncHandler(async (req, res) => {
  res.json(
    await documentService.getDownloadUrl(req.params.id, req.user.id, {
      inline: req.query.inline === '1' || req.query.inline === 'true',
      baseUrl: `${req.protocol}://${req.get('host')}`,
    })
  );
});

exports.view = asyncHandler(async (req, res) => {
  const { doc, object, disposition } = await documentService.openForView(
    req.params.id,
    req.query.token,
    req.headers.range
  );

  res.removeHeader('Content-Security-Policy');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', object.contentType || doc.type);
  res.setHeader('Content-Disposition', disposition);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

  if (object.contentLength !== undefined) {
    res.setHeader('Content-Length', object.contentLength);
  }

  if (object.contentRange) {
    res.status(206);
    res.setHeader('Content-Range', object.contentRange);
  }

  try {
    await pipeline(object.body, res);
  } catch {
    res.destroy();
  }
});
