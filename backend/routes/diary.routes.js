const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const emotionsController = require('../controllers/emotions.controller');

router.post('/', authMiddleware, emotionsController.createDiaryEntry);
router.get('/', authMiddleware, emotionsController.getDiaryEntries);

module.exports = router;
