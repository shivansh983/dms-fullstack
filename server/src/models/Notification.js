const { DataTypes, Model } = require('sequelize');

const TYPES = ['approval', 'ocr', 'expiry', 'system'];

module.exports = (sequelize) => {
  class Notification extends Model {}

  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      body: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM(...TYPES),
        allowNull: false,
        defaultValue: 'system',
      },

      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',

      indexes: [
        { fields: ['user_id'] },

        { fields: ['user_id', 'read'] },
        { fields: ['user_id', 'created_at'] },
      ],
    }
  );

  Notification.TYPES = TYPES;

  return Notification;
};
