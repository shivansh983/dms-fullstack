const { DataTypes, Model } = require('sequelize');

const STATUSES = ['pending', 'completed', 'aborted'];

module.exports = (sequelize) => {
  class Upload extends Model {
    get isComplete() {
      return this.receivedChunks.length === this.totalChunks;
    }

    missingChunks() {
      const have = new Set(this.receivedChunks);
      const missing = [];
      for (let i = 0; i < this.totalChunks; i += 1) {
        if (!have.has(i)) missing.push(i);
      }
      return missing;
    }
  }

  Upload.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      chunkSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      totalChunks: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      receivedChunks: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [],
      },

      storageKey: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      multipartUploadId: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      parts: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },

      title: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },

      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },

      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
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
      modelName: 'Upload',
      tableName: 'uploads',

      indexes: [
        { fields: ['user_id'] },
        { fields: ['user_id', 'status'] },
        { fields: ['status', 'expires_at'] },
      ],
    }
  );

  Upload.STATUSES = STATUSES;

  return Upload;
};
