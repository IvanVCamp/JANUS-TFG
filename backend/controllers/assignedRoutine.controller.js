const AssignedRoutine = require('../models/RoutineInstance');
const RoutineTemplate  = require('../models/RoutineTemplate');

// Asignar plantilla a paciente
exports.assignRoutine = async (req, res) => {
  if (req.user.role !== 'terapeuta')
    return res.status(403).json({ msg: 'Acceso denegado' });
  const { templateId, patientId } = req.body;
  try {
    const tpl = await RoutineTemplate.findById(templateId);
    if (!tpl) return res.status(404).json({ msg: 'Plantilla no encontrada' });

    const inst = new AssignedRoutine({
      template:  tpl._id,
      patient:   patientId,
      therapist: req.user.id
    });
    await inst.save();
    res.status(201).json(inst);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al asignar rutina' });
  }
};

// Listar asignaciones
exports.getAssigned = async (req, res) => {
  try {
    const filter = req.user.role === 'paciente'
      ? { patient: req.user.id }
      : { therapist: req.user.id, patient: req.query.patientId };
    const list = await AssignedRoutine
      .find(filter)
      .populate('template')
      .sort({ assignedAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener asignaciones' });
  }
};

// Actualizar estado de instancia
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;
  try {
    const inst = await AssignedRoutine.findOneAndUpdate(
      { _id: id, patient: req.user.id },
      { status, comment, updatedAt: Date.now() },
      { new: true }
    );
    if (!inst) return res.status(404).json({ msg: 'Asignación no encontrada' });
    res.json(inst);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al actualizar estado' });
  }
};
