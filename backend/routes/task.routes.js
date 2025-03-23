// routes/tasks.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const tasksController = require('../controllers/task.controller');

// GET: listar tareas del usuario
router.get('/', authMiddleware, tasksController.getTasks);

// POST: crear nueva tarea
router.post('/', authMiddleware, tasksController.createTask);

// PUT: actualizar tarea (por arrastre, cambios de horario, etc.)
router.put('/:taskId', authMiddleware, tasksController.updateTask);

// DELETE: eliminar tarea (opcional)
router.delete('/:taskId', authMiddleware, tasksController.deleteTask);

module.exports = router;
