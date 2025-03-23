// routes/chats.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const chatsController = require('../controllers/chats.controller');
const multer = require('multer');

// Configurar Multer para subir archivos a la carpeta "uploads"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Debe existir
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Endpoints
router.get('/', authMiddleware, chatsController.getChats);
router.post('/', authMiddleware, chatsController.startChat);
router.get('/:chatId/messages', authMiddleware, chatsController.getMessages);
router.post('/:chatId/messages', authMiddleware, upload.single('file'), chatsController.sendMessage);

module.exports = router;
