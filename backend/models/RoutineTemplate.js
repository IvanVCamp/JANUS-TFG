const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  challenge: { type: String, enum: ['Bajo', 'Medio', 'Alto'], default: 'Bajo' },
  minutes:   { type: Number, default: 10 }
});

const RoutineTemplateSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  category:    { type: String },
  tags:        [String],
  duration:    { type: Number, default: 30 },
  reminder:    { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
  activities:  [ActivitySchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('RoutineTemplate', RoutineTemplateSchema);