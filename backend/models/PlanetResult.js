const mongoose = require('mongoose');

const HabitatSchema = new mongoose.Schema({
  elementType: { type: String, required: true },
  size: { type: String, enum: ['small', 'medium', 'large'], required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
});

const PlanetResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitats: [HabitatSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlanetResult', PlanetResultSchema);
