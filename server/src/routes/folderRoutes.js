const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const rules = require('../validations/folderValidation');
const ctrl = require('../controllers/folderController');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', rules.create, validate, ctrl.create);
router.put('/:id', rules.rename, validate, ctrl.rename);
router.delete('/:id', rules.byId, validate, ctrl.remove);

module.exports = router;
