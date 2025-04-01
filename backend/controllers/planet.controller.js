// controllers/planetMap.controller.js
const PlanetMap = require('../models/PlanetCreation');

exports.createPlanetMap = async (req, res) => {
  const { elements } = req.body;
  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron elementos para el planeta' });
  }
  try {
    // Procesamos cada elemento para que coincida con el esquema: usamos el campo "id" como elementId
    const processedElements = elements.map(el => ({
      elementId: el.id, // Asegúrate de que el frontend envíe la propiedad "id"
      title: el.title,
      image: el.image,
      size: el.size,
      x: el.x,
      y: el.y
    }));
    const planetMap = new PlanetMap({
      user: req.user.id,
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
    const planetMap = await PlanetMap.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(planetMap);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
