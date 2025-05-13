// backend/models/RoutineInstance.js
const mongoose = require('mongoose');

const RoutineInstanceSchema = new mongoose.Schema({
  template:    { type: mongoose.Schema.Types.ObjectId, ref: 'RoutineTemplate', required: true },
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt:  { type: Date, default: Date.now },
  status:      { type: String, enum: ['pending','completed','postponed'], default: 'pending' }
});

module.exports = mongoose.model('RoutineInstance', RoutineInstanceSchema);
