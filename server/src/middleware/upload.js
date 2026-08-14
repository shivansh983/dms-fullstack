const multer = require('multer');

const config = require('../config/env');
const ApiError = require('../utils/ApiError');

module.exports = multer({
  storage: multer.memoryStorage(),

  limits: { fileSize: config.upload.maxBytes, files: 1 },

  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMime.includes(file.mimetype)) return cb(null, true);

    cb(new ApiError(422, 'Only PDF, JPG and PNG files are allowed'));
  },
});
