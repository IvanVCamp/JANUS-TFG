const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
  activityId: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String },
  rating: { 
    type: String, 
    enum: ['muy feliz', 'feliz', 'neutral', 'poco feliz', 'nada feliz'],
    required: true 
  }
});

const EmotionDiarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Opcional: referenciar el resultado de Máquina del Tiempo evaluado
  gameResult: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeMachineResult' },
  date: { type: Date, default: Date.now },
  entries: [DiaryEntrySchema]
});

module.exports = mongoose.model('EmotionDiary', EmotionDiarySchema);
