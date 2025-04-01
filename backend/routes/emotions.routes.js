const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const diarioController = require('../controllers/emotion.controller');

router.post('/', authMiddleware, diarioController.createDiarioEmociones);
router.get('/', authMiddleware, diarioController.getDiarioEmociones);

module.exports = router;
