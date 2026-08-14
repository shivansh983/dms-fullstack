const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const rules = require('../validations/uploadValidation');
const ctrl = require('../controllers/uploadController');

router.use(authenticate);

router.post('/init', rules.init, validate, ctrl.init);

router.put('/:id/chunk/:index', rules.chunk, validate, ctrl.chunk);

router.get('/:id', rules.byId, validate, ctrl.status);
router.post('/:id/complete', rules.byId, validate, ctrl.complete);
router.delete('/:id', rules.byId, validate, ctrl.abort);

module.exports = router;
