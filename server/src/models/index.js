const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const PasswordResetToken = require('./PasswordResetToken')(sequelize);
const Folder = require('./Folder')(sequelize);
const Document = require('./Document')(sequelize);
const DocumentVersion = require('./DocumentVersion')(sequelize);
const DocumentPage = require('./DocumentPage')(sequelize);
const Approval = require('./Approval')(sequelize);
const Notification = require('./Notification')(sequelize);
const Upload = require('./Upload')(sequelize);

User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'userId',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE',
});

PasswordResetToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Document, { foreignKey: 'userId', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(Folder, { foreignKey: 'userId', as: 'folders' });
Folder.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Folder.hasMany(Document, {
  foreignKey: 'folderId',
  as: 'documents',
  onDelete: 'SET NULL',
});
Document.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });

Document.hasMany(DocumentVersion, {
  foreignKey: 'documentId',
  as: 'versions',
  onDelete: 'CASCADE',
});
DocumentVersion.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
DocumentVersion.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });

Document.hasMany(DocumentPage, {
  foreignKey: 'documentId',
  as: 'pages',
  onDelete: 'CASCADE',
});
DocumentPage.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });

Document.hasOne(Approval, {
  foreignKey: 'documentId',
  as: 'approval',
  onDelete: 'CASCADE',
});
Approval.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
Approval.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Upload, { foreignKey: 'userId', as: 'uploads', onDelete: 'CASCADE' });
Upload.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Upload.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  PasswordResetToken,
  Folder,
  Document,
  DocumentVersion,
  DocumentPage,
  Approval,
  Notification,
  Upload,
};
