// backend/models/RoutineInstance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoutineInstanceSchema = new Schema({
  template:           { type: Schema.Types.ObjectId, ref: 'RoutineTemplate', required: true },
  patient:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  completedActivities: [{ type: Number }]       // guardamos índices de actividades completadas
}, { timestamps: true });

module.exports = mongoose.model('RoutineInstance', RoutineInstanceSchema);
