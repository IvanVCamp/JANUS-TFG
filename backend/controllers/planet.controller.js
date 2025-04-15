// controllers/planetMap.controller.js
const PlanetMap = require('../models/PlanetMap');

exports.createPlanetMap = async (req, res) => {
  const { planetName, planetSlogan, elements } = req.body;
  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron elementos para el planeta' });
  }
  try {
    const processedElements = elements.map(el => ({
      elementId: el.id,
      title: el.title,
      image: el.image,
      size: el.size,
      x: el.x,
      y: el.y
    }));
    const planetMap = new PlanetMap({
      user: req.user.id,
      planetName,
      planetSlogan,
      elements: processedElements
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
    const userId = req.query.patientId || req.user.id;
    const planetMap = await PlanetMap.findOne({ user: userId }).sort({ createdAt: -1 });
    res.json(planetMap);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
