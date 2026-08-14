const ApiError = require('../utils/ApiError');
const folderRepo = require('../repositories/folderRepository');

exports.list = (userId) => folderRepo.list(userId);

exports.create = async (userId, rawName) => {
  const name = String(rawName || '').trim();
  if (!name) throw ApiError.unprocessable('Folder name is required');

  if (await folderRepo.findByName(name, userId)) {
    throw ApiError.conflict('A folder with that name already exists');
  }

  const folder = await folderRepo.create(name, userId);
  return folderRepo.findById(folder.id, userId);
};

exports.rename = async (id, userId, rawName) => {
  const name = String(rawName || '').trim();
  if (!name) throw ApiError.unprocessable('Folder name is required');

  const existing = await folderRepo.findByName(name, userId);
  if (existing && existing.id !== id) {
    throw ApiError.conflict('A folder with that name already exists');
  }

  const [updated] = await folderRepo.rename(id, userId, name);
  if (!updated) throw ApiError.notFound('Folder not found');

  return folderRepo.findById(id, userId);
};

exports.remove = async (id, userId) => {
  const deleted = await folderRepo.remove(id, userId);
  if (!deleted) throw ApiError.notFound('Folder not found');

  return { ok: true };
};
