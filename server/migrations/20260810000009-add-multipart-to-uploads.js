'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('uploads', 'multipart_upload_id', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('uploads', 'parts', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('uploads', 'parts');
    await queryInterface.removeColumn('uploads', 'multipart_upload_id');
  },
};
