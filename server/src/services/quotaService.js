const config = require('../config/env');
const uploadRepo = require('../repositories/uploadRepository');

exports.summary = async (userId) => {
  const { storedBytes, reservedBytes } = await uploadRepo.usage(userId);
  const diskFreeBytes = null;

  const quotaBytes = config.storage.quotaBytes;
  const usedBytes = storedBytes + reservedBytes;
  const remainingBytes = Math.max(0, quotaBytes - usedBytes);

  const diskUsableBytes =
    diskFreeBytes === null
      ? null
      : Math.max(0, Math.floor(diskFreeBytes * (1 - config.storage.diskHeadroomRatio)));

  const limits = [remainingBytes, config.upload.maxFileBytes];
  if (diskUsableBytes !== null) limits.push(diskUsableBytes);

  return {
    quotaBytes,
    storedBytes,
    reservedBytes,
    usedBytes,
    remainingBytes,
    percentUsed: quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0,
    diskFreeBytes,
    diskUsableBytes,
    maxFileBytes: config.upload.maxFileBytes,
    maxUploadableBytes: Math.min(...limits),
    chunkSize: config.upload.chunkSize,
  };
};
