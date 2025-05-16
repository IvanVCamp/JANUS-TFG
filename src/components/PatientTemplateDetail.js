// src/components/PatientTemplateDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import '../styles/routineTemplates.css';

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

function getPatientId() {
  const raw = localStorage.getItem('token');
  if (!raw) return null;
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  const payload = decodeJwt(token);
  return payload?.id || payload?.sub || payload?.user?.id || localStorage.getItem('userId');
}

export default function PatientTemplateDetail() {
  const { instanceId } = useParams();
  const [instance, setInstance] = useState(null);
  const [notes, setNotes]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
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
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.instances)
            ? res.data.instances
            : [];
        const found = list.find(i => i._id === instanceId);
        if (!found) {
          setError('No se encontró la plantilla solicitada.');
        } else {
          setInstance(found);
          // Inicializar notas vacías
          const initNotes = {};
          found.template.activities.forEach((_, idx) => {
            initNotes[idx] = '';
          });
          setNotes(initNotes);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || 'Error al cargar detalles');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [instanceId]);

  const toggleActivity = async idx => {
    if (!instance) return;
    const token = localStorage.getItem('token');
    const was   = instance.completedActivities.includes(idx);
    try {
      await axios.post(
        `/api/routines/instances/${instanceId}/activities/${idx}`,
        { completed: !was },
        { headers: { 'x-auth-token': token } }
      );
      setInstance(inst => ({
        ...inst,
        completedActivities: was
          ? inst.completedActivities.filter(i => i !== idx)
          : [...inst.completedActivities, idx],
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar la actividad.');
    }
  };

  const handleNoteChange = (idx, text) => {
    setNotes(n => ({ ...n, [idx]: text }));
  };

  const saveNote = idx => {
    // Aquí podrías enviar la nota al servidor; de momento es solo local
    console.log(`Nota para actividad ${idx}:`, notes[idx]);
  };

  if (loading) return <p>Cargando detalles…</p>;
  if (error)   return <p className="error-msg">{error}</p>;
  if (!instance) return null;

  const tpl       = instance.template;
  const total     = tpl.activities.length;
  const done      = instance.completedActivities.length;
  const percent   = Math.round((done / total) * 100);

  return (
    <div className="routine-templates-page patient-templates-page tpl-detail-page">
      <div className="tpl-container detail-container">
        {/* Header con Back y título */}
        <div className="detail-header">
          <Link to="/patient/templates" className="back-link">← Volver</Link>
          <h1 className="detail-title">{tpl.name}</h1>
        </div>

        {/* Progreso */}
        <div className="progress-bar">
          <div
            className="progress-filled"
            style={{ width: `${percent}%` }}
            aria-label={`${percent}% completado`}
          />
        </div>
        <p className="progress-text">
          {done} de {total} actividades completadas ({percent}%)
        </p>

        {/* Etiquetas como badges */}
        <div className="tags-container">
          {tpl.tags?.map(tag => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
        </div>

        {/* Indicador de reto */}
        <div className={`challenge-indicator level-${tpl.challengeLevel}`}>
          Reto nivel {tpl.challengeLevel}
        </div>

        {/* Metadatos */}
        <div className="tpl-meta detail-meta">
          <div><i className="fa fa-calendar"></i> Asignado: {new Date(instance.createdAt).toLocaleDateString()}</div>
          <div><i className="fa fa-clock-o"></i> Duración: {tpl.duration} min</div>
          <div><i className="fa fa-flag"></i> Actividades: {total}</div>
          <div><i className="fa fa-refresh"></i> Última actualización: {new Date(instance.updatedAt||instance.createdAt).toLocaleString()}</div>
        </div>

        {/* Descripción general */}
        {tpl.description && (
          <section className="tpl-section">
            <h2 className="section-title">Descripción</h2>
            <p className="section-content">{tpl.description}</p>
          </section>
        )}

        {/* Actividades detalladas */}
        <section className="tpl-section">
          <h2 className="section-title">Actividades Detalladas</h2>
          <ul className="activities-detailed-list">
            {tpl.activities.map((act, i) => {
              const completed = instance.completedActivities.includes(i);
              return (
                <li key={i} className={`activity-detail-item ${completed ? 'completed' : ''}`}>
                  <div className="activity-main">
                    <span className="drag-handle">≡</span>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={() => toggleActivity(i)}
                      />
                      <span className="activity-name">{act.name}</span>
                    </label>
                    <div className="activity-info-icons">
                      <span title="Duración"><i className="fa fa-clock-o"></i> {act.minutes} min</span>
                      <span title="Nivel de reto"><i className="fa fa-star"></i> {act.challenge}</span>
                    </div>
                  </div>
                  {act.desc && (
                    <p className="activity-desc">{act.desc}</p>
                  )}
                  {/* Notas del paciente */}
                  <div className="activity-notes">
                    <textarea
                      placeholder="Tus notas..."
                      value={notes[i] || ''}
                      onChange={e => handleNoteChange(i, e.target.value)}
                    />
                    <button onClick={() => saveNote(i)} className="btn-note">
                      <i className="fa fa-save"></i> Guardar nota
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
