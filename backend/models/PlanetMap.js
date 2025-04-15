// models/PlanetMap.js
const mongoose = require('mongoose');

const PlanetElementSchema = new mongoose.Schema({
  elementId: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String },
  size: { type: Number, required: true }, // 1: Pequeño, 2: Mediano, 3: Grande
  x: { type: Number, required: true },
  y: { type: Number, required: true }
});

const PlanetMapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  elements: [PlanetElementSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlanetMap', PlanetMapSchema);
