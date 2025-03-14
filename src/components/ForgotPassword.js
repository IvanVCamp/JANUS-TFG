import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/forgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    try {
      const response = await authService.forgotPassword(email );
      // Si el backend responde con éxito (p.ej. "Correo de recuperación enviado")
      setMsg(response.data.msg);
    } catch (err) {
      // Manejo de error específico
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Error al enviar el correo de recuperación');
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Recuperar Contraseña</h2>

      {/* Mensajes de éxito o error */}
      {msg && <p className="success">{msg}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="forgot-password-form">
        <div className="input-wrapper">
          <label htmlFor="email">Correo electrónico:</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="forgot-password-btn">Enviar correo</button>
      </form>

      {/* Enlaces para cambiar de acción */}
      <div className="forgot-password-extra-links">
        <p>
          <Link to="/" className="action-link">Iniciar sesión</Link>
          {' '} | {' '}
          <Link to="/register" className="action-link">Registrarse</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
