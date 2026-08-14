const asyncHandler = require('../utils/asyncHandler');
const approvalService = require('../services/approvalService');

exports.approve = asyncHandler(async (req, res) => {
  res.json(
    await approvalService.approve({
      documentId: req.params.id,
      reviewerId: req.user.id,
      comment: req.body?.comment,
    })
  );
});

exports.reject = asyncHandler(async (req, res) => {
  res.json(
    await approvalService.reject({
      documentId: req.params.id,
      reviewerId: req.user.id,
      comment: req.body?.comment,
    })
  );
});
