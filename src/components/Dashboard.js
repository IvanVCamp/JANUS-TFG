import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/home.css';

/**
 * Formatea una fecha en formato YYYY-MM-DD.
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function Home() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Simulamos datos del usuario
  const user = { name: 'Juan' };

  // Simulamos actividades agendadas: claves en formato YYYY-MM-DD
  const tasksByDate = {
    '2025-03-13': ['Ir al médico', 'Enviar correo a Pedro'],
    '2025-03-15': ['Comprar regalo', 'Llamar a Juan'],
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Función para renderizar un puntito rojo en el calendario si hay actividades en ese día
  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDate(date);
      if (tasksByDate[dateStr]) {
        return <div className="task-dot"></div>;
      }
    }
    return null;
  };

  // Al hacer clic en cerrar sesión se muestra el overlay y se redirige después de 2 segundos
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const selectedDateStr = formatDate(selectedDate);
  const tasksForSelectedDate = tasksByDate[selectedDateStr] || [];

  return (
    <div className="home-container">
      {isLoggingOut && (
        <div className="logout-message-overlay">
          <p>¡Adiós, {user.name}! ¡Vuelve pronto por aquí!</p>
        </div>
      )}

      {/* Barra superior */}
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
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Contenedor horizontal para el bloque de botones y el calendario */}
        <div className="calendar-and-buttons">
          {/* Bloque de botones (pegado al calendario) */}
          <div className="buttons-block">
            <button className="option-btn btn-tareas" onClick={() => navigate('/planner')}>TAREAS PLANIFICADAS</button>
            <button className="option-btn btn-recordatorios">RECORDATORIOS</button>
            {/* Al dar clic en FEEDBACK se redirige a la página de mensajería */}
            <button className="option-btn btn-feedback" onClick={() => navigate('/messaging')}>FEEDBACK</button>
          </div>
          {/* Calendario real con puntitos rojos si hay actividades */}
          <div className="calendar-box">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={renderTileContent}
            />
          </div>
        </div>

        {/* Lista de tareas debajo del bloque */}
        <div className="tasks-list">
          <h3>Tareas para {selectedDateStr}</h3>
          {tasksForSelectedDate.length === 0 ? (
            <p>No hay tareas para este día</p>
          ) : (
            <ul>
              {tasksForSelectedDate.map((task, idx) => (
                <li key={idx}>{task}</li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Sección de bienvenida */}
      <section className="welcome-section">
        <h2>¡BIENVENIDO A JANUS!</h2>
        <p>
          Una aplicación destinada a ayudarte de la mejor manera posible con tus
          problemas de administración y balance de tareas.
        </p>
      </section>

      {/* Pie de página */}
      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default Home;
