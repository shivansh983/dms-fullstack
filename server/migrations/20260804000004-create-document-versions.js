'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_versions', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      storage_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('document_versions', {
      fields: ['document_id'],
      name: 'document_versions_document_id',
    });

    await queryInterface.addIndex('document_versions', {
      fields: ['document_id', 'version'],
      unique: true,
      name: 'document_versions_doc_version_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('document_versions');
  },
};
