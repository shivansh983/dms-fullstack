const { DataTypes, Model } = require('sequelize');

const STATUSES = ['pending', 'processing', 'approved', 'rejected'];

module.exports = (sequelize) => {
  class Document extends Model {}

  Document.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Document name is required' },
        },
      },

      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      storageKey: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'processing',
      },

      isFavorite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      ocrConfidence: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },

      ocrEngine: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },

      pageCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      folderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Document',
      tableName: 'documents',

      indexes: [
        { fields: ['user_id'] },
        { fields: ['user_id', 'status'] },
        { fields: ['user_id', 'created_at'] },
        { fields: ['folder_id'] },
      ],
    }
  );

  Document.STATUSES = STATUSES;

  return Document;
};
