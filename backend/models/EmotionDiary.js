const mongoose = require('mongoose');

const EmotionEntrySchema = new mongoose.Schema({
  activityId: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String },
  rating: { type: Number, required: true } // 1 a 5
});

const DiarioEmocionesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diary: [EmotionEntrySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DiarioEmociones', DiarioEmocionesSchema);
