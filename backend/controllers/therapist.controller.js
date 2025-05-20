// controllers/therapist.controller.js
const User = require('../models/User');

exports.getPatients = async (req, res) => {
  try {
    const patients = await User.find({
      role: 'paciente',
      $or: [
        { assignedTherapist: req.user.id },
        { assignedTherapist: { $exists: false } },
        { assignedTherapist: null }
      ]
    }).select('nombre apellidos fechaNacimiento email avatar');
    res.json(patients);
  } catch (err) {
    console.error('Error al obtener pacientes:', err);
    res.status(500).json({ msg: 'Error al obtener pacientes' });
  }
};

