const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

module.exports = (sequelize) => {
  class User extends Model {
    async comparePassword(plain) {
      return bcrypt.compare(plain, this.password);
    }

    toJSON() {
      const { id, name, email, role, mfaEnabled } = this.get();
      return { id, name, email, role, mfaEnabled: Boolean(mfaEnabled) };
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: { msg: 'Must be a valid email' },
        },
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          notEmpty: { msg: 'Password is required' },
        },
      },

      googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },

      mfaEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      mfaSecret: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      pendingMfaSecret: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',

      indexes: [
        { unique: true, fields: ['email'], name: 'users_email_unique' },
        { unique: true, fields: ['google_id'], name: 'users_google_id_unique' },
      ],

      defaultScope: {
        attributes: { exclude: ['password', 'mfaSecret', 'pendingMfaSecret'] },
      },
      scopes: {
        withPassword: {
          attributes: { exclude: ['mfaSecret', 'pendingMfaSecret'] },
        },
        withMfa: {
          attributes: { exclude: ['password'] },
        },
      },

      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
        },
      },
    }
  );

  return User;
};
