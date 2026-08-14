const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class PasswordResetToken extends Model {
    get isExpired() {
      return Date.now() >= this.expiresAt.getTime();
    }

    get isActive() {
      return !this.usedAt && !this.isExpired;
    }
  }

  PasswordResetToken.init(
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

      usedAt: { type: DataTypes.DATE, allowNull: true },

      userId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'password_reset_tokens',
      indexes: [
        {
          unique: true,
          fields: ['token_hash'],
          name: 'password_reset_tokens_token_hash_unique',
        },
        { fields: ['user_id'], name: 'password_reset_tokens_user_id_idx' },
      ],
    }
  );

  return PasswordResetToken;
};
