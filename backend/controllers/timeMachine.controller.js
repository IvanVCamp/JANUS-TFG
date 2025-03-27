const GameResult = require('../models/TimeMachineResult');

exports.createGameResult = async (req, res) => {
  const { day, timeSlots } = req.body;
  if (!day || !timeSlots) {
    return res.status(400).json({ msg: 'Datos incompletos' });
  }
  try {
    const gameResult = new GameResult({
      user: req.user.id,
      day,
      timeSlots
    });
    await gameResult.save();
    res.status(201).json({ msg: 'Resultado guardado', gameResult });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.getGameResults = async (req, res) => {
  try {
    const results = await GameResult.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
