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

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Error obteniendo usuario' })
  }
}

exports.updateAvatar = async (req, res) => {
  try {
    // multer ha colocado el fichero en req.file
    const url = `/uploads/avatars/${req.file.filename}`
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: url },
      { new: true, select: '-password' }
    )
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' })
    res.json({ avatar: user.avatar })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Error subiendo avatar' })
  }
}