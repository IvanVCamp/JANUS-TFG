// backend/controllers/sessionNotes.controller.js
const SessionNote = require('../models/SessionNote');
const User        = require('../models/User');

exports.getByPatient = async (req, res) => {
  try {
    const notes = await SessionNote
      .find({ patient: req.params.patientId })
      .populate('therapist', 'nombre apellidos')
      .sort({ sessionDate: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener notas de sesión' });
  }
};

exports.addNote = async (req, res) => {
  const { patientId } = req.params;
  const { content, sessionDate } = req.body;
  try {
    const therapistId = req.user.id;
    // opcional: verificar que paciente existe
    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ msg: 'Paciente no encontrado' });

    const note = new SessionNote({
      patient: patientId,
      therapist: therapistId,
      sessionDate: sessionDate || Date.now(),
      content
    });
    await note.save();
    const populated = await note.populate('therapist', 'nombre apellidos');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al añadir nota de sesión' });
  }
};

exports.updateNote = async (req, res) => {
  const { noteId } = req.params;
  const { content, sessionDate } = req.body;
  try {
    const note = await SessionNote.findById(noteId);
    if (!note) return res.status(404).json({ msg: 'Nota no encontrada' });
    // solo el terapeuta que creó puede editar
    if (note.therapist.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    note.content     = content ?? note.content;
    note.sessionDate = sessionDate ?? note.sessionDate;
    await note.save();
    const populated = await note.populate('therapist', 'nombre apellidos');
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al actualizar nota' });
  }
};

exports.deleteNote = async (req, res) => {
  const { noteId } = req.params;
  try {
    const note = await SessionNote.findById(noteId);
    if (!note) return res.status(404).json({ msg: 'Nota no encontrada' });
    if (note.therapist.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    await note.remove();
    res.json({ msg: 'Nota eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al eliminar nota' });
  }
};
