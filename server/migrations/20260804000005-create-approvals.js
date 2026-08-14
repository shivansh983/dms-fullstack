'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('approvals', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      decision: {
        type: Sequelize.ENUM('approved', 'rejected'),
        allowNull: false,
      },
      comment: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      reviewer_id: {
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

    await queryInterface.addIndex('approvals', {
      fields: ['document_id'],
      unique: true,
      name: 'approvals_document_unique',
    });

    await queryInterface.addIndex('approvals', {
      fields: ['reviewer_id'],
      name: 'approvals_reviewer_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approvals');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_approvals_decision";');
  },
};
