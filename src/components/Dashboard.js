import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/home.css';

function Home() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="home-container">
      {/* Cabecera similar a la del Dashboard/Mensajería */}
      <header className="top-bar">
        <div className="left-section">
          <i className="fa fa-user-circle user-icon" aria-hidden="true"></i>
        </div>
        <div className="center-section">
          <h1 className="title">JANUS</h1>
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
        {/* Sección de bienvenida */}
        <section className="intro-section">
          <h2>¡Bienvenido/a a JANUS!</h2>
          <p>
            Explora las distintas opciones que tenemos para ti. Elige una sección o revisa el calendario.
          </p>
        </section>

        <div className="buttons-and-calendar">
          {/* Bloque con los 5 botones */}
          <div className="buttons-block">
            <button className="option-btn" onClick={() => navigate('/messaging')}>
              <i className="fa fa-comments icon" aria-hidden="true"></i>
              Mensajería
            </button>

            <button className="option-btn" onClick={() => navigate('/time-machine-game')}>
              <i className="fa fa-clock-o icon" aria-hidden="true"></i>
              Máquina del Tiempo
            </button>

            <button className="option-btn disabled-btn">
              <i className="fa fa-globe icon" aria-hidden="true"></i>
              Mi Planeta
            </button>

            <button className="option-btn disabled-btn">
              <i className="fa fa-rocket icon" aria-hidden="true"></i>
              Misión: Yo puedo
            </button>

            <button className="option-btn" onClick={() => navigate('/diario-de-emociones')}>
              <i className="fa fa-book icon" aria-hidden="true"></i>
              Mi diario de emociones
            </button>
          </div>

          {/* Calendario interactivo */}
          <div className="calendar-block">
            <Calendar onChange={handleDateChange} value={selectedDate} />
          </div>
        </div>
      </main>

      {/* Pie de página similar al de otras pantallas */}
      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default Home;
