const RoutineTemplate = require('../models/RoutineTemplate');

// GET all templates for the logged-in therapist
exports.getAll = async (req, res) => {
  try {
    const templates = await RoutineTemplate.find({ createdBy: req.user.id });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST create new template
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
