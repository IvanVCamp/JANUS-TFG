const PlanetResult = require('../models/PlanetResult');

exports.createPlanetResult = async (req, res) => {
  const { habitats } = req.body;
  if (!habitats || !Array.isArray(habitats) || habitats.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron hábitats' });
  }
  try {
    const result = new PlanetResult({
      user: req.user.id,
      habitats
    });
    await result.save();
    res.status(201).json({ msg: 'Planeta guardado', result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.getPlanetResults = async (req, res) => {
  try {
    const results = await PlanetResult.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
