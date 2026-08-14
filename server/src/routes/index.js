const { Router } = require('express');

const { health } = require('../controllers/health.controller');

const router = Router();

router.get('/health', health);

router.use('/auth', require('./authRoutes'));
router.use('/profile', require('./profileRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/folders', require('./folderRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/approvals', require('./approvalRoutes'));
router.use('/uploads', require('./uploadRoutes'));
router.use('/storage', require('./storageRoutes'));

module.exports = router;
