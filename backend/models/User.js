// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true },
  fechaNacimiento: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  assignedTherapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Nuevo campo para pacientes
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
