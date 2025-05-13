// src/pages/PatientTemplatesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/routineTemplates.css';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';

export default function PatientTemplatesPage() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Leer y decodificar el token para extraer el patientId
  const token = localStorage.getItem('token');
  let patientId = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    patientId = payload.user.id;
  } catch (e) {
    // token inválido → forzar login
    navigate('/login');
  }

  useEffect(() => {
    if (!token || !patientId) {
      return navigate('/login');
    }
    const headers = {
      'Content-Type':  'application/json',
      'x-auth-token':  token
    };
    fetch(`/api/routines/instances/${patientId}`, { headers })
      .then(async res => {
        if (res.status === 401) {
          alert('Sesión expirada');
          return navigate('/login');
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Error ${res.status}: ${txt}`);
        }
        return res.json();
      })
      .then(data => {
        // data = array de RoutineInstance con populate('template')
        setInstances(data);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate, patientId, token]);

  const toggleDone = async (instId, activityIdx, done) => {
    try {
      await fetch(`/api/routines/instances/${instId}/activities/${activityIdx}`, {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ completed: done })
      });
      setInstances(ins =>
        ins.map(i =>
          i._id === instId
            ? {
                ...i,
                template: {
                  ...i.template,
                  activities: i.template.activities.map((a, idx) =>
                    idx === activityIdx ? { ...a, completed: done } : a
                  )
                }
              }
            : i
        )
      );
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado');
    }
  };

  if (loading) return <div className="tpl-container">Cargando…</div>;
  if (error)   return <div className="tpl-container">Error: {error}</div>;

  return (
    <div className="routine-templates-page">
      <div className="tpl-container">
        <div className="tpl-header">
          <h1>Mis Plantillas Asignadas</h1>
        </div>

        {instances.length === 0 ? (
          <div className="empty-state">
            📂 No tienes plantillas asignadas.
          </div>
        ) : (
          instances.map(inst => (
            <div key={inst._id} className="tpl-card">
              <h2>{inst.template.name}</h2>
              <p className="tpl-desc">{inst.template.description}</p>
              <ul className="tpl-activities-list">
                {inst.template.activities.map((act, idx) => (
                  <li key={idx}>
                    <button
                      className="activity-toggle"
                      onClick={() => toggleDone(inst._id, idx, !act.completed)}
                    >
                      {act.completed ? <FaCheckCircle/> : <FaRegCircle/>}
                    </button>
                    <span className={act.completed ? 'done' : ''}>
                      {act.name} ({act.minutes} min)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
