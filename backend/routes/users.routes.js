// routes/users.routes.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware'); 

router.get('/search', authMiddleware, usersController.searchUsers);
// routes/users.routes.js
router.get('/patients', authMiddleware, async (req, res) => {
    try {
      // Buscar todas las invitaciones aceptadas creadas por este terapeuta
      const invitations = await Invitation.find({ therapist: req.user.id, accepted: true });
      // Extraer los correos de los pacientes
      const emails = invitations.map(inv => inv.invitedEmail);
      // Buscar los pacientes registrados con esos correos
      const patients = await User.find({ email: { $in: emails }, role: 'paciente' });
      res.json(patients);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error en el servidor' });
    }
  });
  
module.exports = router;
