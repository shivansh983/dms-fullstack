const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const ctrl = require('../controllers/profileController');

router.get('/', authenticate, ctrl.me);

module.exports = router;
