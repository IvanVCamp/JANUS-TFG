const EmotionDiary = require('../models/EmotionDiary');

exports.createDiaryEntry = async (req, res) => {
  const { gameResult, entries } = req.body;
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ msg: 'No se proporcionaron entradas' });
  }
  try {
    const diary = new EmotionDiary({
      user: req.user.id,
      gameResult: gameResult || null,
      entries
    });
    await diary.save();
    res.status(201).json({ msg: 'Diario de emociones guardado', diary });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.getDiaryEntries = async (req, res) => {
  try {
    const diaries = await EmotionDiary.find({ user: req.user.id }).sort({ date: -1 });
    res.json(diaries);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
