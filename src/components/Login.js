// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/login.css';
import janusLogo from '../assets/janus-logo.png';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Redireccionar según el rol devuelto:
      if(response.data.role === 'terapeuta') {
        navigate('/therapist');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="login-container">
      <div className="logo-section">
        <img src={janusLogo} alt="Logotipo" className="janus-logo" />
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && <p className="error">{error}</p>}
        <div className="input-wrapper">
          <label htmlFor="email" className="sr-only">Correo electrónico</label>
          <div className="input-icon-container">
            <i className="fa fa-envelope icon" aria-hidden="true"></i>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="tucorreo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="input-wrapper">
          <label htmlFor="password" className="sr-only">Contraseña</label>
          <div className="input-icon-container">
            <i className="fa fa-key icon" aria-hidden="true"></i>
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
        </div>
        <div className="options-container">
          <label className="remember-me">
            <input type="checkbox" name="remember" />
            <span>Recuérdame</span>
          </label>
          <a href="/forgot-password" className="forgot-password">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <button type="submit" className="login-btn">Iniciar sesión</button>
      </form>
      <p className="register-link">
        ¿No tienes una cuenta? <a href="/register">Regístrate</a>
      </p>
    </div>
  );
}

export default Login;
