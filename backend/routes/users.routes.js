const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth.middleware');
const c       = require('../controllers/users.controller');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const avatarsDir = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(avatarsDir, { recursive: true });
console.log('[DEBUG] carpeta avatars disponible en:', avatarsDir);

// 2) Configura Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, req.user.id + ext);
  }
});
const upload = multer({ storage });


// GET /api/users/me
router.get('/me', auth, c.getMe);
// PUT /api/users/me/avatar
router.put('/me/avatar', auth, upload.single('avatar'), c.updateAvatar);

router.get('/search', auth, c.searchUsers);
// routes/users.routes.js
router.get('/patients', auth, async (req, res) => {
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
