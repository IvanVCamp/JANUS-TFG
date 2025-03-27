import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/emotionsDiary.css';

const emotionLevels = [
  { level: 'muy feliz', icon: '😁' },
  { level: 'feliz', icon: '🙂' },
  { level: 'neutral', icon: '😐' },
  { level: 'poco feliz', icon: '🙁' },
  { level: 'nada feliz', icon: '😢' }
];

function EmotionsDiary() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState(null);
  const [ratings, setRatings] = useState({}); // key: activityId, value: rating string
  const [loading, setLoading] = useState(true);

  // Se obtiene el resultado más reciente de Máquina del Tiempo
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    axios.get('http://localhost:5000/api/game', {
      headers: { 'x-auth-token': token }
    })
    .then(response => {
      if (response.data && response.data.length > 0) {
        setGameResult(response.data[0]); // El más reciente
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [navigate]);

  const handleRatingChange = (activityId, rating) => {
    setRatings(prev => ({
      ...prev,
      [activityId]: rating
    }));
  };

  const handleSaveDiary = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    // Preparamos las entradas: se recorren los slots del resultado para formar una lista de evaluaciones
    let entries = [];
    if (gameResult && gameResult.timeSlots) {
      gameResult.timeSlots.forEach(slot => {
        if (slot.activities && slot.activities.length > 0) {
          slot.activities.forEach(act => {
            // Usamos act.activityId como clave (asegúrate de que en el guardado de Máquina del Tiempo se almacene de esta forma)
            const rating = ratings[act.activityId];
            if (rating) {
              entries.push({
                activityId: act.activityId,
                title: act.title,
                icon: act.icon,
                rating: rating
              });
            }
          });
        }
      });
    }
    if (entries.length === 0) {
      alert('Por favor, selecciona un nivel de emoción para al menos una actividad.');
      return;
    }
    const payload = {
      gameResult: gameResult ? gameResult._id : null,
      entries
    };
    try {
      await axios.post('http://localhost:5000/api/diary', payload, {
        headers: { 'x-auth-token': token }
      });
      alert('¡Tu diario de emociones ha sido guardado!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el diario.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="emotions-diary-container">
      <header className="ed-header">
        <div className="ed-header-left">
          <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>←</button>
          <h1>Diario de Emociones</h1>
        </div>
      </header>

      <div className="ed-instructions">
        <p>¿Cómo te sientes con lo bien que haces estas actividades?</p>
      </div>

      <main className="ed-main">
        {gameResult ? (
          <div className="activities-list">
            {gameResult.timeSlots.map((slot, idx) => (
              <div key={idx} className="activity-slot">
                <h3>{slot.slot}</h3>
                <div className="activities">
                  {slot.activities.map(act => (
                    <div key={act.activityId} className="activity-card">
                      <div className="activity-info">
                        <span className="activity-icon">{act.icon}</span>
                        <span className="activity-title">{act.title}</span>
                      </div>
                      <div className="emotion-options">
                        {emotionLevels.map(item => (
                          <button
                            key={item.level}
                            className={`emotion-btn ${ratings[act.activityId] === item.level ? 'selected' : ''}`}
                            onClick={() => handleRatingChange(act.activityId, item.level)}
                          >
                            {item.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No se encontró un resultado de Máquina del Tiempo.</p>
        )}
      </main>

      <div className="ed-actions">
        <button className="ed-save-btn" onClick={handleSaveDiary}>Guardar Diario</button>
      </div>

      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default EmotionsDiary;
