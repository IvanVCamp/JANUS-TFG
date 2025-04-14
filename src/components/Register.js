// src/components/Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import axios from 'axios';
import '../styles/register.css';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const invitationId = query.get('invitationId'); // Extraemos invitationId de la URL

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    fechaNacimiento: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convertir el valor seleccionado a minúsculas
  const handleSelectChange = (e) => {
    setFormData({ ...formData, role: e.target.value.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Si se registra como paciente, comprobar que exista una invitación válida
    if (formData.role.toLowerCase() === "paciente") {
      try {
        let response;
        // Si existe invitationId en la URL, se utiliza para validar la invitación
        if (invitationId) {
          response = await axios.get(
            `http://localhost:5000/api/invitations?invitationId=${invitationId}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          // Caso alternativo: se puede validar usando el correo
          const token = localStorage.getItem('token');
          const normalizedEmail = formData.email.trim().toLowerCase();
          response = await axios.get(
            `http://localhost:5000/api/invitations?email=${normalizedEmail}`,
            { headers: { 'x-auth-token': token, 'Content-Type': 'application/json' } }
          );
        }
        if (!response.data.valid) {
          setError('No tienes una invitación válida para registrarte como paciente');
          return;
        }
        // Asigna el id del terapeuta que invitó para vincular al paciente
        formData.invitedBy = response.data.therapist;
      } catch (error) {
        console.error("Error en la validación de la invitación:", error);
        setError('Error al validar la invitación');
        return;
      }
    }

    try {
      await authService.register(formData);
      setSuccess('Registro exitoso, ya puedes iniciar sesión.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Error en el registro. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2 className="form-title">Crear Cuenta</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <div className="input-wrapper">
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            placeholder="Tu nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="apellidos">Apellidos:</label>
          <input
            type="text"
            name="apellidos"
            id="apellidos"
            placeholder="Tus apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="fechaNacimiento">Fecha de Nacimiento:</label>
          <input
            type="date"
            name="fechaNacimiento"
            id="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="********"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrapper">
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            placeholder="********"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-wrapper roles-wrapper">
          <label htmlFor="role">Rol:</label>
          <select
            name="role"
            id="role"
            value={formData.role}
            onChange={handleSelectChange}
            className="styled-dropdown"
            required
          >
            <option value="">Selecciona un rol</option>
            <option value="padre">Padre</option>
            <option value="paciente">Paciente</option>
            <option value="terapeuta">Terapeuta</option>
            <option value="tutor">Tutor</option>
          </select>
        </div>

        <div className="button-wrapper">
          <button type="submit" className="register-btn">Registrar</button>
        </div>

        <div className="login-link-wrapper">
          <p>
            ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;
