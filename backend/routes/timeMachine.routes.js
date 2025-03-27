const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const timeMachineController = require('../controllers/timeMachine.controller');

router.post('/', authMiddleware, timeMachineController.createGameResult);
router.get('/', authMiddleware, timeMachineController.getGameResults);

module.exports = router;
