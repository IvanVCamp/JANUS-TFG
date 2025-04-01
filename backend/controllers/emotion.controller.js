const DiarioEmociones = require('../models/EmotionDiary');

exports.createDiarioEmociones = async (req, res) => {
  const { diary } = req.body;
  if (!diary || !Array.isArray(diary) || diary.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron datos para el diario' });
  }
  try {
    const newDiario = new DiarioEmociones({
      user: req.user.id,
      diary
    });
    await newDiario.save();
    res.status(201).json({ msg: 'Diario de emociones guardado', newDiario });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.getDiarioEmociones = async (req, res) => {
  try {
    const diary = await DiarioEmociones.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(diary);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
