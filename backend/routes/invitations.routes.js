// routes/invitations.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const invitationsController = require('../controllers/invitations.controller');

router.post('/', authMiddleware, invitationsController.createInvitation);
router.get('/', invitationsController.getInvitation);

module.exports = router;
