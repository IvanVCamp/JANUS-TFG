const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  activityId: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String },
  slot: { type: String, required: true },
  duration: { type: Number, required: true }
});

const GameResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, enum: ['Miércoles', 'Sábado'], required: true },
  timeSlots: [{
    slot: { type: String, required: true },
    activities: [ActivitySchema]
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimeMachineGameResult', GameResultSchema);
