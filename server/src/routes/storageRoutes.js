const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const ctrl = require('../controllers/storageController');

router.use(authenticate);

router.get('/', ctrl.summary);

module.exports = router;
