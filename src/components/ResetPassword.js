import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/resetPassword.css'; // Opcional: un archivo CSS para estilos

function ResetPassword() {
  const navigate = useNavigate();
  // useSearchParams para obtener el "token" de la URL, e.g. ?token=XYZ
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que ambas contraseñas coinciden
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      // Llamamos al servicio para resetear la contraseña
      await authService.resetPassword(token, password);
      setMessage('¡Contraseña actualizada con éxito!');

      // Redirigimos al dashboard (o a login) después de un tiempo
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      // Si el token es inválido o expiró, el backend devolverá un error
      setError('Token inválido o expirado');
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Restablecer Contraseña</h2>
      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="input-wrapper">
          <label>Nueva Contraseña:</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-wrapper">
          <label>Confirmar Contraseña:</label>
          <input
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="reset-btn">Cambiar Contraseña</button>
      </form>
    </div>
  );
}

export default ResetPassword;
