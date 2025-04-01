import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/emotionsDiary.css';

function EmotionsDiary() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [ratings, setRatings] = useState({}); // { activityId: rating }
  
  // Verifica que el token exista; si no, redirige al login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);

  // Cargar actividades desde los resultados de la Máquina del Tiempo
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:5000/api/game', { headers: { 'x-auth-token': token } })
      .then(response => {
        // Suponemos que response.data es un array de resultados, cada uno con timeSlots
        const gameResults = response.data;
        const activityMap = {};
        gameResults.forEach(result => {
          if (result.timeSlots) {
            result.timeSlots.forEach(slot => {
              if (slot.activities) {
                slot.activities.forEach(act => {
                  // Agrupar por activityId para obtener actividades únicas
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
  }, []);

  // Niveles del termómetro: valores del 1 al 5.
  const levels = [
    { value: 1, label: 'Nada feliz', emoji: '😞' },
    { value: 2, label: 'Poco feliz', emoji: '🙁' },
    { value: 3, label: 'Neutral', emoji: '😐' },
    { value: 4, label: 'Feliz', emoji: '🙂' },
    { value: 5, label: 'Muy feliz', emoji: '😄' }
  ];

  const handleRatingChange = (activityId, rating) => {
    setRatings(prev => ({ ...prev, [activityId]: rating }));
  };

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
      await axios.post('http://localhost:5000/api/emotions', payload, {
        headers: { 'x-auth-token': token }
      });
      alert('¡Tu diario de emociones ha sido guardado!');
      navigate('/dashboard');
    } catch (error) {
      console.error("Error al guardar el diario:", error);
      alert('Error al guardar el diario de emociones.');
    }
  };

  return (
    <div className="diario-emociones-container">
      <header className="de-header">
        <div className="de-header-left">
          <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>←</button>
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
