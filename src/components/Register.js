import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/register.css';

function Register() {
  const navigate = useNavigate();

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

  const handleSelectChange = (e) => {
    setFormData({ ...formData, role: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
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

        {/* Mensajes de error/éxito (ocupan 2 columnas) */}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {/* Campo: Nombre */}
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

        {/* Campo: Contraseña */}
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

        {/* Campo: Apellidos */}
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

        {/* Campo: Confirmar Contraseña */}
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

        {/* Campo: Fecha de Nacimiento */}
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

        {/* Campo: Rol */}
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
            <option value="Padre">Padre</option>
            <option value="paciente">Paciente</option>
            <option value="terapeuta">Terapeuta</option>
            <option value="tutor">Tutor</option>
          </select>
        </div>

        {/* Campo: Email */}
        <div className="input-wrapper">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="example@gmail.cc"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Botón de Registrar */}
        <div className="button-wrapper">
          <button type="submit" className="register-btn">Registrar</button>
        </div>

        {/* Enlace para iniciar sesión */}
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
