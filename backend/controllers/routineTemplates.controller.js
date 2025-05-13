// backend/controllers/routinetemplates.controller.js
const RoutineTemplate = require('../models/RoutineTemplate');

// GET all…
exports.getAll = async (req, res) => {
  try {
    const templates = await RoutineTemplate.find({ createdBy: req.user.id });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET one template by id
exports.getOne = async (req, res) => {
  try {
    const tpl = await RoutineTemplate.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!tpl) return res.status(404).json({ error: 'Not found' });
    res.json(tpl);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST create new…
exports.create = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    const tpl = new RoutineTemplate(data);
    await tpl.save();
    res.status(201).json(tpl);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// PUT update template
exports.update = async (req, res) => {
  try {
    // Prepara payload sin _id en subdocumentos
    const { activities, ...rest } = req.body;
    const cleanActs = activities.map(({ name, desc, challenge, minutes }) => ({
      name, desc, challenge, minutes
    }));
    const updated = await RoutineTemplate.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { ...rest, activities: cleanActs },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE a template by id (only if createdBy matches)
exports.remove = async (req, res) => {
  try {
    const tpl = await RoutineTemplate.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!tpl) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
