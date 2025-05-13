// backend/routes/routineInstances.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const c = require('../controllers/routineInstances.controller');

// Asignar plantilla a paciente
router.post('/',             auth, c.assignToPatient);
// Obtener rutinas asignadas a un paciente
router.get('/:patientId',    auth, c.getByPatient);

router.post('/:instanceId/activities/:activityIdx', auth,c.markActivity);

module.exports = router;
