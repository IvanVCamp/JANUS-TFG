const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken, generateResetToken } = require('../utils/token');
const sendEmail = require('../utils/mailer');
const Invitation = require('../models/Invitation'); // Para manejar registro de pacientes

exports.register = async (req, res) => {
  // Se extrae también el campo "invitationId"
  const { nombre, apellidos, fechaNacimiento, email, password, role, invitationId } = req.body;

  try {
    // Verificar si ya existe usuario
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    let assignedTherapist = null;
    // Si el rol es de paciente, verificar invitación válida
    if (role === 'paciente') {
      let invitation;
      if (invitationId) {
        // Buscar por ID de invitación
        invitation = await Invitation.findOne({ _id: invitationId, accepted: false });
      } else {
        // Fallback: buscar por email normalizado
        const normalizedEmail = email.trim().toLowerCase();
        invitation = await Invitation.findOne({ email: normalizedEmail, accepted: false });
      }
      if (!invitation) {
        console.log('No se encontró una invitación válida.');
        return res.status(400).json({ msg: 'No tienes una invitación válida para registrarte como paciente' });
      }
      // Sellar la invitación para que no pueda reutilizarse
      invitation.accepted = true;
      await invitation.save();
      assignedTherapist = invitation.therapist;
    }

    // Procesar la fecha de nacimiento
    let fechaNacimientoDate;
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

    // Crear y guardar el usuario
    user = new User({
      nombre,
      apellidos,
      fechaNacimiento: fechaNacimientoDate,
      email,
      password,
      role,
      assignedTherapist
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Enviar correo de bienvenida (opcional)
    await sendEmail({
      to: user.email,
      subject: 'Bienvenido a la aplicación',
      text: 'Gracias por registrarte. ¡Bienvenido!',
      html: '<p>Gracias por registrarte. ¡Bienvenido!</p>'
    });

    // Generar y devolver token con rol
    const token = generateToken(user.id, user.role.toLowerCase());
    res.json({
      token,
      role: user.role.toLowerCase(),
      user: { id: user.id, nombre: user.nombre, email: user.email }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }
    const token = generateToken(user.id, user.role.toLowerCase());
    res.json({ token, role: user.role.toLowerCase() });
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

    const resetToken = generateResetToken(user._id);
    const resetUrl = `https://janus-1030141284513.europe-southwest1.run.app/reset-password?token=${resetToken}`;
localhost
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resetsecret');
    const userId = decoded.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: 'Usuario no encontrado' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.json({ msg: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Token no válido o expirado' });
  }
};