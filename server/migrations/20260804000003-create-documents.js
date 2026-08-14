'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(100),
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
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'processing',
      },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING(255)),
        allowNull: false,
        defaultValue: [],
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      folder_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'folders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('documents', {
      fields: ['user_id'],
      name: 'documents_user_id',
    });

    await queryInterface.addIndex('documents', {
      fields: ['user_id', 'status'],
      name: 'documents_user_id_status',
    });

    await queryInterface.addIndex('documents', {
      fields: ['user_id', 'created_at'],
      name: 'documents_user_id_created_at',
    });

    await queryInterface.addIndex('documents', {
      fields: ['folder_id'],
      name: 'documents_folder_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_status";');
  },
};
