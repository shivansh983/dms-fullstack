const router = require('express').Router();
const { param } = require('express-validator');

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', ctrl.list);

router.put('/read-all', ctrl.markAllRead);

router.put(
  '/:id/read',
  param('id').isUUID().withMessage('Invalid notification id'),
  validate,
  ctrl.markRead
);

module.exports = router;
