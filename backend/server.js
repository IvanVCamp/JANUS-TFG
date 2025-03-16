// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());

// Servir la carpeta 'uploads' como contenido estático para descargar archivos
app.use('/uploads', express.static('uploads'));

// Rutas del backend
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/chats', require('./routes/chats.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
