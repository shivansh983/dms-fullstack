'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_pages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },

      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' },
        onDelete: 'CASCADE',
      },

      page_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      confidence: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      engine: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('document_pages', ['document_id', 'page_number'], {
      unique: true,
      name: 'document_pages_doc_page_unique',
    });

    await queryInterface.sequelize.query(
      'CREATE INDEX document_pages_content_trgm ON document_pages USING gin (content gin_trgm_ops);'
    );

    await queryInterface.addColumn('documents', 'ocr_engine', {
      type: Sequelize.STRING(32),
      allowNull: true,
    });

    await queryInterface.addColumn('documents', 'page_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('documents', 'page_count');
    await queryInterface.removeColumn('documents', 'ocr_engine');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS document_pages_content_trgm;');
    await queryInterface.dropTable('document_pages');
  },
};
