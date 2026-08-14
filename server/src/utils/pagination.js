const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

module.exports = function paginate(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  return { page, limit, offset: (page - 1) * limit };
};

module.exports.DEFAULT_LIMIT = DEFAULT_LIMIT;
module.exports.MAX_LIMIT = MAX_LIMIT;
