'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('uploads', {
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
      chunk_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_chunks: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      received_chunks: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false,
        defaultValue: [],
      },
      storage_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING(255)),
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'aborted'),
        allowNull: false,
        defaultValue: 'pending',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('uploads', {
      fields: ['user_id'],
      name: 'uploads_user_id',
    });

    await queryInterface.addIndex('uploads', {
      fields: ['user_id', 'status'],
      name: 'uploads_user_id_status',
    });

    await queryInterface.addIndex('uploads', {
      fields: ['status', 'expires_at'],
      name: 'uploads_status_expires_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('uploads');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_uploads_status";');
  },
};
