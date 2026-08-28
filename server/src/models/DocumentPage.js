const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class DocumentPage extends Model {}

  DocumentPage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      pageNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      confidence: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },

      engine: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'DocumentPage',
      tableName: 'document_pages',

      indexes: [
        {
          unique: true,
          fields: ['document_id', 'page_number'],
          name: 'document_pages_doc_page_unique',
        },
      ],
    }
  );

  return DocumentPage;
};
