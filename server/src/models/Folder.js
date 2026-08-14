const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Folder extends Model {}

  Folder.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Folder name is required' },
        },
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Folder',
      tableName: 'folders',

      indexes: [
        { fields: ['user_id'] },

        { unique: true, fields: ['user_id', 'name'], name: 'folders_user_name_unique' },
      ],
    }
  );

  return Folder;
};
