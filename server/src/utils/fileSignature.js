const config = require('../config/env');
const ApiError = require('./ApiError');

const REJECTED = 'File content is not an allowed type (PDF, JPG and PNG only)';

let loading;

function fileType() {
  if (!loading) loading = import('file-type');
  return loading;
}

async function detect(buffer) {
  const { fileTypeFromBuffer } = await fileType();
  return fileTypeFromBuffer(buffer);
}

async function assertAllowed(buffer, declaredMime) {
  const detected = await detect(buffer);

  if (!detected || !config.upload.allowedMime.includes(detected.mime)) {
    throw ApiError.unprocessable(REJECTED);
  }

  if (declaredMime && detected.mime !== declaredMime) {
    throw ApiError.unprocessable(
      `This file is really a ${detected.mime}, not the ${declaredMime} it claims to be`
    );
  }

  return detected.mime;
}

module.exports = { detect, assertAllowed };
