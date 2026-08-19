'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('documents', 'content', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('documents', 'ocr_confidence', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    await queryInterface.sequelize.query(
      'CREATE INDEX documents_content_trgm ON documents USING gin (content gin_trgm_ops);'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS documents_content_trgm;');
    await queryInterface.removeColumn('documents', 'ocr_confidence');
    await queryInterface.removeColumn('documents', 'content');
  },
};
