// src/components/PatientTemplates.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/routineTemplates.css';

/**
 * Decodifica un JWT y devuelve su payload como objeto,
 * o null si falla.
 */
function decodeJwt(token) {
  try {
    const b64Url = token.split('.')[1];
    const b64    = b64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json   = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Obtiene el patientId de:
 * 1) payload del JWT (id, sub o user.id),
 * 2) fallback a localStorage.userId si lo guardas en login.
 */
function getPatientId() {
  const raw = localStorage.getItem('token');
  if (!raw) return null;
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  const payload = decodeJwt(token);
  if (payload) {
    return payload.id || payload.sub || payload.user?.id || null;
  }
  return localStorage.getItem('userId');
}

export default function PatientTemplates() {
  const [instances, setInstances] = useState([]);
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const fetchInstances = async () => {
      const token     = localStorage.getItem('token');
      const patientId = getPatientId();
      if (!token || !patientId) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `/api/routines/instances/${patientId}`,
          { headers: { 'x-auth-token': token } }
        );
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.instances)
            ? res.data.instances
            : [];
        setInstances(data);
      } catch (err) {
        console.error('Error al cargar instancias:', err);
        setError(err.response?.data?.msg || 'Error al cargar plantillas');
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, []);

  const toggleActivity = async (instanceId, idx) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const inst = instances.find(i => i._id === instanceId);
    if (!inst) return;
    const was = inst.completedActivities.includes(idx);

    try {
      await axios.post(
        `/api/routines/instances/${instanceId}/activities/${idx}`,
        { completed: !was },
        { headers: { 'x-auth-token': token } }
      );
      setInstances(prev =>
        prev.map(i =>
          i._id !== instanceId
            ? i
            : {
                ...i,
                completedActivities: was
                  ? i.completedActivities.filter(n => n !== idx)
                  : [...i.completedActivities, idx]
              }
        )
      );
    } catch (err) {
      console.error('Error marcando actividad:', err);
      setError('No se pudo actualizar la actividad');
    }
  };

  if (loading) return <p>Cargando tus plantillas…</p>;
  if (error)   return <p className="error-msg">{error}</p>;

  const filtered = instances.filter(inst =>
    filterTag
      ? inst.template.tags?.includes(filterTag)
      : true
  );

  return (
    <div className="routine-templates-page patient-templates-page">
      <div className="tpl-container">
        <div className="tpl-header">
          <h1>Mis Plantillas Asignadas</h1>
          <input
            type="text"
            className="small-input tag-filter"
            placeholder="Filtrar por etiqueta"
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p>No se encontraron plantillas con esa etiqueta.</p>
        ) : (
          <div className="tpl-grid">
            {filtered.map(inst => (
              <div key={inst._id} className="tpl-card">
                {/* Icono lupa para ir al detalle */}
                <Link
                  to={`/patient/templates/${inst._id}`}
                  className="tpl-detail-link"
                  title="Ver detalle"
                >
                  <i className="fa fa-search" aria-hidden="true"></i>
                </Link>

                <h2 className="tpl-title">{inst.template.name}</h2>
                <p className="tpl-desc">{inst.template.description}</p>
                <div className="tpl-meta">
                  Asignado el:{' '}
                  {new Date(inst.createdAt).toLocaleDateString()} | Duración:{' '}
                  {inst.template.duration} min | Tags:{' '}
                  {inst.template.tags?.join(', ')}
                </div>

                <ul className="tpl-activities-list">
                  {inst.template.activities.map((act, i) => {
                    const completed = inst.completedActivities.includes(i);
                    return (
                      <li key={i} className="activity-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={completed}
                            onChange={() => toggleActivity(inst._id, i)}
                          />
                          <span className={completed ? 'completed' : ''}>
                            {act.name} – Nivel {act.challenge} – {act.minutes}{' '}
                            min
                          </span>
                        </label>
                        {act.desc && (
                          <p className="activity-desc">{act.desc}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
