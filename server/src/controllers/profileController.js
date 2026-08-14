const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userRepo = require('../repositories/userRepository');

exports.me = asyncHandler(async (req, res) => {
  const user = await userRepo.findByIdWithPassword(req.user.id);

  if (!user) throw ApiError.notFound('User not found');

  res.json({ user: { ...user.toJSON(), hasPassword: Boolean(user.password) } });
});
