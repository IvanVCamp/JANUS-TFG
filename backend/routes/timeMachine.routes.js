const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const gameController = require('../controllers/game.controller');

router.post('/', authMiddleware, gameController.createGameResult);
router.get('/', authMiddleware, gameController.getGameResults);

module.exports = router;
