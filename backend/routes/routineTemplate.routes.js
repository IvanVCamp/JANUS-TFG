const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/routineTemplates.controller');

router.get('/',    auth, controller.getAll);
router.post('/',   auth, controller.create);
router.delete('/:id', auth, controller.remove);

module.exports = router;
