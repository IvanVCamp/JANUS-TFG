const PlanetMap = require('../models/PlanetCreation');

exports.createPlanetMap = async (req, res) => {
  const { elements } = req.body;
  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron elementos para el planeta' });
  }
  try {
    const planetMap = new PlanetMap({
      user: req.user.id,
      elements
    });
    await planetMap.save();
    res.status(201).json({ msg: 'Planeta guardado', planetMap });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.getPlanetMap = async (req, res) => {
  try {
    const planetMap = await PlanetMap.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(planetMap);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
