const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class DocumentVersion extends Model {}

  DocumentVersion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      version: {
        type: DataTypes.INTEGER,
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

      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'DocumentVersion',
      tableName: 'document_versions',

      indexes: [
        { fields: ['document_id'] },
        { unique: true, fields: ['document_id', 'version'], name: 'document_versions_doc_version_unique' },
      ],
    }
  );

  return DocumentVersion;
};
