'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('password_reset_tokens', {
      fields: ['token_hash'],
      unique: true,
      name: 'password_reset_tokens_token_hash_unique',
    });

    await queryInterface.addIndex('password_reset_tokens', {
      fields: ['user_id'],
      name: 'password_reset_tokens_user_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('password_reset_tokens');
  },
};
