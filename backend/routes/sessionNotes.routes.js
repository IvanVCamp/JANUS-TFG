// backend/routes/sessionNotes.routes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth.middleware');
const c       = require('../controllers/sessionNotes.controller');

// Listar notas de un paciente
router.get(
  '/:patientId/notes',
  auth,
  c.getByPatient
);

// Añadir nota de sesión
router.post(
  '/:patientId/notes',
  auth,
  c.addNote
);

// Editar nota concreta
router.put(
  '/notes/:noteId',
  auth,
  c.updateNote
);

// Eliminar nota concreta
router.delete(
  '/notes/:noteId',
  auth,
  c.deleteNote
);

module.exports = router;
