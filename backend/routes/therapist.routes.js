// routes/therapist.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const therapistController = require('../controllers/therapist.controller');

// Endpoint para obtener los pacientes asignados
router.get('/patients', authMiddleware, therapistController.getPatients);

module.exports = router;
