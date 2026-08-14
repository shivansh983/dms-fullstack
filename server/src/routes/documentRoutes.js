const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const rules = require('../validations/documentValidation');
const ctrl = require('../controllers/documentController');

router.use(authenticate);

router.get('/stats', ctrl.stats);

router.get('/', rules.list, validate, ctrl.list);

router.post('/', upload.single('file'), rules.create, validate, ctrl.create);

router.get('/:id', rules.byId, validate, ctrl.getById);
router.get('/:id/versions', rules.byId, validate, ctrl.versions);
router.get('/:id/download', rules.byId, validate, ctrl.download);

router.put('/:id', rules.updateMeta, validate, ctrl.updateMeta);
router.post('/:id/move', rules.move, validate, ctrl.move);
router.delete('/:id', rules.byId, validate, ctrl.remove);

module.exports = router;
