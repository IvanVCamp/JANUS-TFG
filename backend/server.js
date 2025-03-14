const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Crear la aplicación
const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json()); // Para parsear JSON
app.use(cors());

// Definir rutas
app.use('/api/auth', require('./routes/auth.routes'));

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
