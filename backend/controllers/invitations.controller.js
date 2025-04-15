// controllers/invitation.controller.js
const Invitation = require('../models/Invitation');
const sendEmail = require('../utils/mailer');

exports.createInvitation = async (req, res) => {
  const { invitedEmail } = req.body;
  const therapistId = req.user.id;
  
  if (!invitedEmail) {
    return res.status(400).json({ msg: 'El correo es obligatorio' });
  }
  try {
    // Normalizamos el correo al crearlo
    const normalizedEmail = invitedEmail.trim().toLowerCase();

    // Verifica si ya existe una invitación pendiente para ese correo por este terapeuta
    const existing = await Invitation.findOne({ email: normalizedEmail, therapist: therapistId, accepted: false });
    if (existing) {
      return res.status(400).json({ msg: 'Ya se ha enviado una invitación a este correo' });
    }
    // Crear la invitación usando el correo normalizado
    const invitation = new Invitation({ email: normalizedEmail, therapist: therapistId });
    await invitation.save();

    // Generar un enlace de registro usando el ID de la invitación
    const registrationLink = `http://localhost:3000/register?invitationId=${invitation._id}`;
    const emailSubject = 'Invitación para registrarte en JANUS';
    const emailText = `Hola,\n\nSe te ha invitado a registrarte en la plataforma JANUS. 
Por favor, haz clic en el siguiente enlace para completar tu registro:\n\n${registrationLink}\n\nAtentamente,\nTu terapeuta`;
    const emailHtml = `<p>Hola,</p>
      <p>Se te ha invitado a registrarte en la plataforma <strong>JANUS</strong>.</p>
      <p>Haz clic en el siguiente enlace para completar tu registro:</p>
      <p><a href="${registrationLink}">${registrationLink}</a></p>
      <p>Atentamente,<br/>Tu terapeuta</p>`;

    // Enviar el correo de invitación
    await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.status(201).json({ msg: 'Invitación generada y enviada', invitation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

  exports.getInvitation = async (req, res) => {
    const { email, invitationId } = req.query;
    if (!email && !invitationId) {
      return res.status(400).json({ msg: 'Es obligatorio proporcionar el correo o el ID de la invitación' });
    }
    try {
      let invitation;
      if (invitationId) {
        invitation = await Invitation.findOne({ _id: invitationId, accepted: false });
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        invitation = await Invitation.findOne({ email: normalizedEmail, accepted: false });
      }
      if (!invitation) {
        return res.json({ valid: false });
      }
      return res.json({ valid: true, therapist: invitation.therapist });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error en el servidor' });
    }
  };
  