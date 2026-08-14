const asyncHandler = require('../utils/asyncHandler');
const quotaService = require('../services/quotaService');

exports.summary = asyncHandler(async (req, res) => {
  res.json(await quotaService.summary(req.user.id));
});
