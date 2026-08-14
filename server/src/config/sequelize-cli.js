const config = require('./env');

const base = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  define: { underscored: true, timestamps: true },
};

module.exports = {
  development: base,
  test: { ...base, database: `${config.db.name}_test` },
  production: base,
};
