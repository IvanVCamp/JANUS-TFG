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

// backend/controllers/routineInstances.controller.js
exports.markActivity = async (req, res) => {
  const { instanceId, activityIdx } = req.params;
  const { completed } = req.body;   // boolean

  try {
    const inst = await RoutineInstance.findById(instanceId);
    if (!inst) return res.status(404).json({ msg: 'Instancia no encontrada' });
    // Verifica que el paciente sea el suyo
    if (inst.patient.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'No autorizado' });
    }
    const idx = parseInt(activityIdx, 10);
    const set = new Set(inst.completedActivities.map(Number));

    if (completed) set.add(idx);
    else set.delete(idx);

    inst.completedActivities = Array.from(set);
    await inst.save();

    res.json({ 
      instanceId,
      completedActivities: inst.completedActivities 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error marcando actividad' });
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