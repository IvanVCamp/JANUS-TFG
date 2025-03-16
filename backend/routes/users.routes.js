// routes/users.routes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware'); 

router.get('/search', authMiddleware, usersController.searchUsers);

module.exports = router;
