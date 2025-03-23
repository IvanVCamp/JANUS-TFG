// controllers/tasks.controller.js
const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ startTime: 1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error getTasks:', err);
    res.status(500).json({ msg: 'Error al obtener tareas' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, category, startTime, endTime, reminderTime } = req.body;
    const newTask = new Task({
      user: req.user.id,
      title,
      description,
      category,
      startTime,
      endTime,
      reminderTime
    });
    await newTask.save();
    // Aquí podrías disparar la lógica para programar una notificación, etc.
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error createTask:', err);
    res.status(500).json({ msg: 'Error al crear tarea' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updatedFields = req.body; // title, startTime, endTime, etc.

    // Solo permitir que el usuario dueño de la tarea la actualice
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: req.user.id },
      { $set: updatedFields },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ msg: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (err) {
    console.error('Error updateTask:', err);
    res.status(500).json({ msg: 'Error al actualizar tarea' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOneAndDelete({ _id: taskId, user: req.user.id });
    if (!task) {
      return res.status(404).json({ msg: 'Tarea no encontrada' });
    }
    res.json({ msg: 'Tarea eliminada' });
  } catch (err) {
    console.error('Error deleteTask:', err);
    res.status(500).json({ msg: 'Error al eliminar tarea' });
  }
};
