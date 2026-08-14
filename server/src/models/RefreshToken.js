const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class RefreshToken extends Model {
    get isExpired() {
      return Date.now() >= this.expiresAt.getTime();
    }

    get isActive() {
      return !this.revokedAt && !this.isExpired;
    }
  }

  RefreshToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },

      expiresAt: { type: DataTypes.DATE, allowNull: false },

      revokedAt: { type: DataTypes.DATE, allowNull: true },

      userId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      indexes: [
        { unique: true, fields: ['token_hash'], name: 'refresh_tokens_token_hash_unique' },
        { fields: ['user_id'], name: 'refresh_tokens_user_id_idx' },
      ],
    }
  );

  return RefreshToken;
};
