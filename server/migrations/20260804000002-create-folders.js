'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('folders', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
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

    await queryInterface.addIndex('folders', {
      fields: ['user_id'],
      name: 'folders_user_id',
    });

    await queryInterface.addIndex('folders', {
      fields: ['user_id', 'name'],
      unique: true,
      name: 'folders_user_name_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('folders');
  },
};
