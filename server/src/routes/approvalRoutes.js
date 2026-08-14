const router = require('express').Router();
const { param, body } = require('express-validator');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/approvalController');

router.use(authenticate, authorize('admin'));

const rules = [
  param('id').isUUID().withMessage('Invalid document id'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment is too long'),
];

router.post('/:id/approve', rules, validate, ctrl.approve);
router.post('/:id/reject', rules, validate, ctrl.reject);

module.exports = router;
