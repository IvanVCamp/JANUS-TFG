// server.js
require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./backend/config/db');
const app = express();

// 1) Conectar a la base de datos
connectDB();

// 2) Middlewares
app.use(cors());
app.use(express.json());

// 3) Carpetas estáticas auxiliares
// Carpeta de uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// 4) Servir build de React **antes** de las APIs
const frontendPath = path.join(__dirname, 'build');
app.use(express.static(frontendPath));

// 5) Rutas del backend
app.use('/api/auth', require('./backend/routes/auth.routes'));
app.use('/api/users', require('./backend/routes/users.routes'));
app.use('/api/chats', require('./backend/routes/chats.routes'));
app.use('/api/tasks', require('./backend/routes/task.routes'));
app.use('/api/game', require('./backend/routes/timeMachine.routes'));
app.use('/api/emotions', require('./backend/routes/emotions.routes'));
app.use('/api/planet-map', require('./backend/routes/planetMap.routes'));
app.use('/api/invitations', require('./backend/routes/invitations.routes'));
app.use('/api/therapist', require('./backend/routes/therapist.routes'));
app.use('/api/routines/instances', require('./backend/routes/routineInstances.routes'));
app.use('/api/routines/templates', require('./backend/routes/routineTemplate.routes'));
app.use('/api/therapist/patients', require('./backend/routes/sessionNotes.routes'));
app.use('/uploads/avatars', express.static(uploadsDir));
app.use(
  '/uploads/avatars',
  express.static(path.join(__dirname, 'uploads', 'avatars'))
);
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 7) Arrancar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Servidor corriendo en puerto ${PORT}`)
);
