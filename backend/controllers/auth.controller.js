const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateToken, generateResetToken } = require('../utils/token');
const sendEmail = require('../utils/mailer');

exports.register = async (req, res) => {
  const { nombre, apellidos, fechaNacimiento, email, password } = req.body;

  try {
    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    let fechaNacimientoDate;
    // Convertir fecha según formato recibido
    if (fechaNacimiento.includes('/')) {
      const parts = fechaNacimiento.split('/');
      if (parts.length !== 3) {
        return res.status(400).json({ msg: 'Formato de fecha inválido, use dd/mm/yyyy' });
      }
      fechaNacimientoDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (fechaNacimiento.includes('-')) {
      fechaNacimientoDate = new Date(fechaNacimiento);
    } else {
      return res.status(400).json({ msg: 'Formato de fecha inválido' });
    }

    // Crear y guardar usuario
    user = new User({
      nombre,
      apellidos,
      fechaNacimiento: fechaNacimientoDate,
      email,
      password
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Enviar correo de bienvenida
    await sendEmail({
      to: user.email,
      subject: 'Bienvenido a la aplicación',
      text: 'Gracias por registrarte. ¡Bienvenido!',
      html: '<p>Gracias por registrarte. ¡Bienvenido!</p>'
    });

    // Generar token de sesión y redirigir al dashboard
    const token = generateToken(user.id);
    res.status(201).json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar y validar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const token = generateToken(user.id);
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'No existe usuario con ese email' });
    }

    // Generar token de reseteo usando generateResetToken
    const resetToken = generateResetToken(user._id);
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    // Enviar correo de recuperación
    await sendEmail({
      to: user.email,
      subject: 'Recuperación de contraseña',
      text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetUrl}`,
      html: `<p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p><a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({ msg: 'Correo de recuperación enviado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ msg: 'Token y nueva contraseña son requeridos' });
  }

  try {
    // Verificar el token usando el secreto para reset
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resetsecret');
    const userId = decoded.user.id;

    // Buscar el usuario por su id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: 'Usuario no encontrado' });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Guardar los cambios en la base de datos
    await user.save();

    res.json({ msg: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Token no válido o expirado' });
  }
};
