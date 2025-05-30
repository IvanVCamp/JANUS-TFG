import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/emotionsDiary.css';

function decodeJwt(token) {
  try {
    const b64    = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

function EmotionsDiary() {
  const navigate = useNavigate();
  const location = useLocation();
  // Determinamos el modo (snapshot vs interactivo) leyendo la query "patientId"
  const searchParams = new URLSearchParams(location.search);
  const queryPatientId = searchParams.get('patientId');
  const isViewMode = Boolean(queryPatientId);

  // Estados para el modo interactivo
  const [activities, setActivities] = useState([]);
  const [ratings, setRatings] = useState({});

  // Estado para el modo snapshot (diario guardado)
  const [snapshotDiary, setSnapshotDiary] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Niveles de felicidad para el termómetro
  const levels = [
    { value: 1, label: 'Nada feliz', emoji: '😞' },
    { value: 2, label: 'Poco feliz', emoji: '🙁' },
    { value: 3, label: 'Neutral', emoji: '😐' },
    { value: 4, label: 'Feliz', emoji: '🙂' },
    { value: 5, label: 'Muy feliz', emoji: '😄' }
  ];

  // Verificar que exista token; sino, redirige al login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const payload = decodeJwt(token);
    setUserRole(payload.user?.role || payload.role);
  }, [navigate]);
  // Si estamos en modo snapshot, obtenemos el último diario guardado
  useEffect(() => {
    if (isViewMode) {
      const fetchSnapshotDiary = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`https://janus-1030141284513.europe-southwest1.run.app/api/emotions?patientId=${queryPatientId}`, {
            headers: { 'x-auth-token': token }
          });
          if (response.data && response.data.length > 0) {
            // Tomamos el diario más reciente (el primero)
            setSnapshotDiary(response.data[0]);
          }
        } catch (error) {
          console.error("Error al obtener el diario de emociones guardado:", error);
        }
      };
      fetchSnapshotDiary();
    } else {
      // En modo interactivo, cargamos las actividades a partir de los resultados de la Máquina del Tiempo
      const token = localStorage.getItem('token');
      axios
        .get('https://janus-1030141284513.europe-southwest1.run.app/api/game', { headers: { 'x-auth-token': token } })
        .then(response => {
          const gameResults = response.data;
          const activityMap = {};
          gameResults.forEach(result => {
            if (result.timeSlots) {
              result.timeSlots.forEach(slot => {
                if (slot.activities) {
                  slot.activities.forEach(act => {
                    if (!activityMap[act.activityId]) {
                      activityMap[act.activityId] = {
                        activityId: act.activityId,
                        title: act.title,
                        icon: act.icon
                      };
                    }
                  });
                }
              });
            }
          });
          setActivities(Object.values(activityMap));
        })
        .catch(error => {
          console.error("Error al cargar actividades:", error);
        });
    }
  }, [isViewMode, queryPatientId]);

  // Función para cambiar el rating en modo interactivo
  const handleRatingChange = (activityId, rating) => {
    setRatings(prev => ({ ...prev, [activityId]: rating }));
  };

  // Función para enviar el diario (guardar) en modo interactivo
  const handleSubmitDiary = async () => {
    const token = localStorage.getItem('token');
    const payload = {
      diary: activities.map(act => ({
        activityId: act.activityId,
        title: act.title,
        icon: act.icon,
        rating: ratings[act.activityId] || 3 // Valor por defecto: neutral
      }))
    };
    try {
      await axios.post('/api/emotions', payload, {
        headers: { 'x-auth-token': token }
      });
      alert('¡Tu diario de emociones ha sido guardado!');
      navigate('/dashboard');
    } catch (error) {
      console.error("Error al guardar el diario:", error);
      alert('Error al guardar el diario de emociones.');
    }
  };

  const handleGoBack = () => {
    if (isViewMode) {
      // en snapshot, venimos desde /therapist/patients
      navigate('/therapist/patients');
    } else {
      // en interactivo, paciente vuelve a /dashboard
      navigate(userRole === 'terapeuta' ? '/therapist/patients' : '/dashboard');
    }
  };

  // Renderizado condicional según el modo: Snapshot (Vista) o Interactivo (Paciente)
  if (isViewMode) {
    // Modo Snapshot: Se muestra el diario de emociones guardado de forma estática
    return (
      <div className="diario-emociones-container">
        <header className="de-header">
          <div className="de-header-left">
            <button
              className="back-dashboard-btn"
              onClick={handleGoBack}
            >←</button>            
            <h1>Diario de Emociones - Último Guardado</h1>
          </div>
        </header>
        <main className="de-main">
          <section className="de-intro">
            <p>A continuación se muestra el estado de tu diario de emociones guardado.</p>
          </section>
          <section className="de-activities">
            {snapshotDiary && snapshotDiary.diary && snapshotDiary.diary.length > 0 ? (
              <div className="activities-grid">
                {snapshotDiary.diary.map((entry, index) => {
                  const level = levels.find(l => l.value === entry.rating);
                  return (
                    <div key={index} className="activity-card">
                      <div className="activity-icon">{entry.icon}</div>
                      <div className="activity-title">{entry.title}</div>
                      <div className="activity-thermometer">
                        <div className="thermo-display">
                          <span className="thermo-emoji">{level ? level.emoji : ''}</span>
                          <span className="thermo-label">{level ? level.label : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No se encontró un diario guardado.</p>
            )}
          </section>
        </main>
        <footer className="de-footer">
          <p>2025 © Iván Vela Campos</p>
        </footer>
      </div>
    );
  }

  // Modo interactivo: El paciente puede seleccionar los ratings y guardar el diario
  return (
    <div className="diario-emociones-container">
      <header className="de-header">
        <div className="de-header-left">
          <button
            className="back-dashboard-btn"
            onClick={handleGoBack}
          >←</button>         
          <h1>Diario de Emociones</h1>
        </div>
      </header>
      <main className="de-main">
        <section className="de-intro">
          <p>¿Cómo te sientes con lo bien que haces estas actividades?</p>
        </section>
        <section className="de-activities">
          {activities.length === 0 ? (
            <p>No hay actividades registradas en tu Máquina del Tiempo.</p>
          ) : (
            <div className="activities-grid">
              {activities.map(act => (
                <div key={act.activityId} className="activity-card">
                  <div className="activity-icon">{act.icon}</div>
                  <div className="activity-title">{act.title}</div>
                  <div className="activity-thermometer">
                    {levels.map(level => (
                      <button
                        key={level.value}
                        className={`thermo-btn ${ratings[act.activityId] === level.value ? 'selected' : ''}`}
                        onClick={() => handleRatingChange(act.activityId, level.value)}
                      >
                        <span className="thermo-emoji">{level.emoji}</span>
                        <span className="thermo-label">{level.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="de-submit">
          <button className="de-submit-btn" onClick={handleSubmitDiary}>Guardar Diario</button>
        </section>
      </main>
      <footer className="de-footer">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default EmotionsDiary;
