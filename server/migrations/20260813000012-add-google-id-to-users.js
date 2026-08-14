'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'google_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addIndex('users', {
      fields: ['google_id'],
      unique: true,
      name: 'users_google_id_unique',
    });

    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.removeIndex('users', 'users_google_id_unique');
    await queryInterface.removeColumn('users', 'google_id');
  },
};
