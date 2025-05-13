// backend/controllers/routineInstances.controller.js
const RoutineInstance = require('../models/RoutineInstance');
const RoutineTemplate = require('../models/RoutineTemplate');

exports.assignToPatient = async (req, res) => {
  const { templateId, patientId } = req.body;
  try {
    // Opcional: validar existencia de plantilla
    const tpl = await RoutineTemplate.findById(templateId);
    if (!tpl) return res.status(404).json({ msg: 'Plantilla no encontrada' });

    const inst = new RoutineInstance({
      template: templateId,
      patient: patientId,
      assignedBy: req.user.id
    });
    await inst.save();
    res.status(201).json(inst);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error asignando plantilla' });
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const instances = await RoutineInstance
      .find({ patient: req.params.patientId })
      .populate('template');
    res.json(instances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error obteniendo asignaciones' });
  }
};
