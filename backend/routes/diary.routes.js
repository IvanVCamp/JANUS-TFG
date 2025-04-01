const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const diaryController = require('../controllers/emotion.controller');

router.post('/', authMiddleware, diaryController.createEmotionDiary);
router.get('/', authMiddleware, diaryController.getEmotionDiaries);

module.exports = router;
