const { DataTypes, Model } = require('sequelize');

const DECISIONS = ['approved', 'rejected'];

module.exports = (sequelize) => {
  class Approval extends Model {}

  Approval.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      decision: {
        type: DataTypes.ENUM(...DECISIONS),
        allowNull: false,
      },

      comment: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      decidedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      reviewerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Approval',
      tableName: 'approvals',

      indexes: [

        { unique: true, fields: ['document_id'], name: 'approvals_document_unique' },
        { fields: ['reviewer_id'] },
      ],
    }
  );

  Approval.DECISIONS = DECISIONS;

  return Approval;
};
