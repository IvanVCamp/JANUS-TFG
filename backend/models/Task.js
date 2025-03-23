// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Personal', 'Estudio', 'Terapia', 'Ocio', 'Otro'], default: 'Otro' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  reminderTime: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
