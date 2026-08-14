'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      body: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('approval', 'ocr', 'expiry', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('notifications', {
      fields: ['user_id'],
      name: 'notifications_user_id',
    });

    await queryInterface.addIndex('notifications', {
      fields: ['user_id', 'read'],
      name: 'notifications_user_id_read',
    });

    await queryInterface.addIndex('notifications', {
      fields: ['user_id', 'created_at'],
      name: 'notifications_user_id_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
