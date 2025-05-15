// src/pages/PatientTemplatesPage.js
import React, { useState, useEffect } from 'react';
import {
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaRegCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/routineTemplates.css';

export default function PatientTemplatesPage() {
  const [instances, setInstances] = useState([]);
  const [expanded, setExpanded]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const navigate = useNavigate();

  // Token JWT
  const token = localStorage.getItem('token');

  // Extraer patientId del payload del JWT
  let patientId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      patientId = payload.user?.id || payload.id || payload.sub;
    } catch (e) {
      console.error('Error decodificando token:', e);
    }
  }

  useEffect(() => {
    if (!token || !patientId) {
      console.warn('Falta token o patientId – redirigiendo a login');
      navigate('/login');
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    };

    fetch(`/api/routines/instances/${patientId}`, { headers })
      .then(res => {
        if (res.status === 401) {
          alert('Sesión expirada. Por favor, inicia sesión de nuevo.');
          navigate('/login');
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setInstances(data);
        } else {
          console.error('Respuesta inesperada:', data);
          setError('Datos inválidos del servidor');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate, token, patientId]);

  const toggleExpand = id => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const markActivity = (instId, idx) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    };
    fetch(`/api/routines/instances/${instId}/activities/${idx}`, {
      method: 'POST',
      headers
    })
      .then(res => {
        if (!res.ok) throw new Error('No se pudo actualizar actividad');
        // Actualizar estado local
        setInstances(list =>
          list.map(i => {
            if (i._id !== instId) return i;
            const activities = Array.isArray(i.activities) ? i.activities : [];
            return {
              ...i,
              activities: activities.map((a, j) =>
                j === idx ? { ...a, completed: !a.completed } : a
              )
            };
          })
        );
      })
      .catch(err => console.error(err));
  };

  const completeAll = inst => {
    const activities = Array.isArray(inst.activities) ? inst.activities : [];
    activities.forEach((_, idx) => {
      if (!activities[idx].completed) {
        markActivity(inst._id, idx);
      }
    });
  };

  const postpone = instId => {
    setInstances(list =>
      list.map(i =>
        i._id === instId ? { ...i, status: 'postponed' } : i
      )
    );
  };

  if (loading) {
    return (
      <div className="routine-templates-page tpl-container">
        <h1>Mis Plantillas Asignadas</h1>
        <p>Cargando plantillas…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="routine-templates-page tpl-container">
        <h1>Mis Plantillas Asignadas</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="routine-templates-page">
      <div className="tpl-container">
        <h1>Mis Plantillas Asignadas</h1>

        {instances.length === 0 ? (
          <div className="empty-state">
            🤔 Aún no tienes plantillas asignadas
          </div>
        ) : (
          <div className="tpl-grid">
            {instances.map(inst => {
              const activities = Array.isArray(inst.activities) ? inst.activities : [];
              const total = activities.length;
              const done = activities.filter(a => a.completed).length;
              const pct = total ? (done / total) * 100 : 0;
              const tmpl = inst.template || {};

              return (
                <div
                  key={inst._id}
                  className={`tpl-card ${inst.status === 'completed' ? 'status-completed' : inst.status === 'postponed' ? 'status-postponed' : ''}`}>
                  <div className="assign-header">
                    <div>
                      <h2>{tmpl.name || '—'}</h2>
                      <p className="tpl-desc">{tmpl.description || ''}</p>
                    </div>
                    <button className="btn-icon" onClick={() => toggleExpand(inst._id)}>
                      {expanded[inst._id] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>

                  <div className="progress-container">
                    <label>{done}/{total} completadas</label>
                    <progress value={pct} max="100" />
                  </div>

                  <div className="assign-actions">
                    {inst.status === 'pending' && (
                      <> 
                        <button className="btn-complete" onClick={() => completeAll(inst)}>
                          Completar todo
                        </button>
                        <button className="btn-postpone" onClick={() => postpone(inst._id)}>
                          Posponer
                        </button>
                      </>
                    )}
                    {inst.status === 'completed' && <span>✔️ Completado</span>}
                    {inst.status === 'postponed' && <span>⏳ Pospuesto</span>}
                  </div>

                  {expanded[inst._id] && (
                    <div className="activities-list">
                      {activities.map((act, idx) => (
                        <div key={idx} className={`activity-line ${act.completed ? 'completed' : ''}`}>
                          <div>
                            {act.completed ? <FaCheckCircle /> : <FaRegCircle />}
                            <span style={{ marginLeft: '0.5rem' }}>{act.name}</span>
                          </div>
                          {!act.completed && (
                            <button className="btn-complete" onClick={() => markActivity(inst._id, idx)}>
                              Marcar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}