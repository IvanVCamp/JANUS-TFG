// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());

// Asegurar que la carpeta "uploads" exista
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Servir la carpeta "uploads" de forma estática
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/chats', require('./routes/chats.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/game', require('./routes/timeMachine.routes'));
app.use('/api/emotions', require('./routes/emotions.routes'));
app.use('/api/planet-map', require('./routes/planetMap.routes'));
app.use('/api/invitations', require('./routes/invitations.routes'));
app.use('/api/therapist', require('./routes/therapist.routes'));

const PORT = process.env.PORT || 5000 || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
