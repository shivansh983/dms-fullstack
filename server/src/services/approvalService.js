const ApiError = require('../utils/ApiError');
const { sequelize, Approval } = require('../models');
const docRepo = require('../repositories/documentRepository');
const notificationRepo = require('../repositories/notificationRepository');

async function decide({ documentId, reviewerId, decision, comment }) {
  const doc = await docRepo.findAnyInstance(documentId);
  if (!doc) throw ApiError.notFound('Document not found');

  if (doc.status === decision) {
    throw ApiError.conflict(`This document is already ${decision}`);
  }

  await sequelize.transaction(async (t) => {
    const [approval, created] = await Approval.findOrCreate({
      where: { documentId },
      defaults: { documentId, reviewerId, decision, comment: comment || null, decidedAt: new Date() },
      transaction: t,
    });

    if (!created) {
      approval.set({ reviewerId, decision, comment: comment || null, decidedAt: new Date() });
      await approval.save({ transaction: t });
    }

    doc.status = decision;
    await doc.save({ transaction: t });

    await notificationRepo.create(
      {
        userId: doc.userId,
        title: decision === 'approved' ? 'Document approved' : 'Document rejected',
        body: `${doc.name} was ${decision}.`,
        type: 'approval',
      },
      { transaction: t }
    );
  });

  return docRepo.findById(documentId, doc.userId);
}

exports.approve = ({ documentId, reviewerId, comment }) =>
  decide({ documentId, reviewerId, decision: 'approved', comment });

exports.reject = ({ documentId, reviewerId, comment }) =>
  decide({ documentId, reviewerId, decision: 'rejected', comment });
