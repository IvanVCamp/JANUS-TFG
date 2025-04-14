// TherapistDashboardHome.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import axios from 'axios';
import '../styles/therapistDashboard.css';

function TherapistDashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  const handleInvitationSubmit = async () => {
    // Validación simple del correo
    const emailTrimmed = inviteEmail.trim();
  if (!emailTrimmed) {
    setInviteMsg('Por favor, ingresa un correo electrónico válido.');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      'http://localhost:5000/api/invitations',
      { invitedEmail: emailTrimmed },
      { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } }
    );
    setInviteMsg('Invitación enviada con éxito.');
    setShowModal(false);
    setInviteEmail('');
  } catch (err) {
    console.error(err.response.data);
    setInviteMsg(err.response.data.msg || 'Error al enviar la invitación.');
  }
};

  return (
    <div className="home-container">
      {/* Cabecera */}
      <header className="top-bar">
        <div className="left-section">
          <i className="fa fa-user-circle user-icon" aria-hidden="true"></i>
        </div>
        <div className="center-section">
          <h1 className="title">Dashboard Terapeuta</h1>
        </div>
        <div className="right-section">
          <i className="fa fa-bell bell-icon" aria-hidden="true"></i>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fa fa-sign-out" aria-hidden="true"></i>
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        <section className="intro-section">
          <h2>¡Bienvenido, Terapeuta!</h2>
          <p>Accede a tus herramientas y consulta la información estadística de tus pacientes.</p>
        </section>
        <div className="buttons-and-calendar">
          <div className="buttons-block">
            <div className="button-group">
              <h3>HERRAMIENTAS DE GESTIÓN</h3>
              <button className="option-btn" onClick={() => navigate('/therapist/patients')}>
                <i className="fa fa-users icon" aria-hidden="true"></i>
                Lista de Pacientes
              </button>
              <button className="option-btn" onClick={() => navigate('/messaging')}>
                <i className="fa fa-comments icon" aria-hidden="true"></i>
                Mensajería
              </button>
              <button className="option-btn" onClick={() => setShowModal(true)}>
                <i className="fa fa-envelope icon" aria-hidden="true"></i>
                Generar Invitación
              </button>
            </div>
            <div className="button-group">
              <h3>INFORMACIÓN ESTADÍSTICA</h3>
              <button className="option-btn" onClick={() => navigate('/therapist/routines')}>
                <i className="fa fa-clock-o icon" aria-hidden="true"></i>
                Rutinas y Tiempo
              </button>
              <button className="option-btn" onClick={() => navigate('/therapist/interests')}>
                <i className="fa fa-line-chart icon" aria-hidden="true"></i>
                Intereses
              </button>
              <button className="option-btn" onClick={() => navigate('/therapist/satisfaction')}>
                <i className="fa fa-smile-o icon" aria-hidden="true"></i>
                Satisfacción
              </button>
            </div>
          </div>
          <div className="calendar-block">
            <Calendar onChange={setSelectedDate} value={selectedDate} />
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>

      {/* Modal para generar invitación */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generar Invitación</h2>
            <p>Introduce el correo electrónico del paciente:</p>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="paciente@ejemplo.com"
            />
            <div className="modal-buttons">
              <button onClick={handleInvitationSubmit}>Enviar Invitación</button>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
            {inviteMsg && <p className="invite-msg">{inviteMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TherapistDashboard;
