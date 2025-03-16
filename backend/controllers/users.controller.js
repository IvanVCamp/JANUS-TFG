// controllers/users.controller.js
const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ msg: 'El parámetro de búsqueda es requerido' });
  }

  try {
    // Usamos una expresión regular insensible a mayúsculas/minúsculas
    const regex = new RegExp(q, 'i');

    // Buscar usuarios por nombre, apellidos o email
    const users = await User.find({
      $or: [
        { nombre: regex },
        { apellidos: regex },
        { email: regex }
      ]
    }).select('-password'); // Excluir el password

    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};
