// src/components/TherapistPatientTemplatesDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import '../styles/routineTemplates.css';
import '../styles/detailsTemplate.css';

export default function TherapistPatientTemplatesDetail() {
  const { patientId } = useParams();
  const [patient, setPatient]       = useState(null);
  const [instances, setInstances]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No autenticado');
        setLoading(false);
        return;
      }
      try {
        // 1) Datos del paciente
        const { data: patients } = await axios.get('/api/therapist/patients', {
          headers: { 'x-auth-token': token }
        });
        const p = patients.find(px => px._id === patientId);
        if (!p) throw new Error('Paciente no encontrado');
        setPatient(p);

        // 2) Instancias de plantillas asignadas
        const { data: insts } = await axios.get(
          `/api/routines/instances/${patientId}`,
          { headers: { 'x-auth-token': token } }
        );
        setInstances(Array.isArray(insts) ? insts : []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [patientId]);

  if (loading) return <p>Cargando detalles…</p>;
  if (error)   return <p className="error-msg">{error}</p>;
  if (!patient) return null;

  return (
    <div className="routine-templates-page therapist-detail-page">
      <div className="tpl-container detail-container">
        <div className="detail-header">
          <Link to="/therapist/templates" className="back-link">
            ← Volver a plantillas
          </Link>
          <h1>
            Estado de plantillas: {patient.nombre} {patient.apellidos}
          </h1>
        </div>

        {/* Info Paciente */}
        <section className="patient-info">
          <div><strong>Email:</strong> {patient.email}</div>
          <div><strong>Fecha de Nac.:</strong> {new Date(patient.fechaNacimiento).toLocaleDateString()}</div>
        </section>

        {/* Para cada plantilla asignada */}
        {instances.map(inst => {
          const tpl     = inst.template;
          const total   = tpl.activities.length;
          const done    = inst.completedActivities.length;
          const pct     = Math.round((done/total)*100);
          return (
            <div key={inst._id} className="tpl-card detail-card">
              <h2 className="tpl-title">{tpl.name}</h2>
              <p className="tpl-desc">{tpl.description}</p>

              {/* Progreso */}
              <div className="progress-bar small">
                <div className="progress-filled" style={{width:`${pct}%`}} />
              </div>
              <p className="progress-text">
                {done}/{total} completadas ({pct}%)
              </p>

              {/* Badges */}
              <div className="tags-container">
                {tpl.tags?.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>

              {/* Reto */}
              <div className={`challenge-indicator level-${tpl.challengeLevel}`}>
                Nivel de reto: {tpl.challengeLevel}
              </div>

              {/* Metadatos */}
              <div className="tpl-meta detail-meta">
                <div><i className="fa fa-calendar"></i> Asignada: {new Date(inst.createdAt).toLocaleDateString()}</div>
                <div><i className="fa fa-clock-o"></i> Duración: {tpl.duration} min</div>
                <div><i className="fa fa-refresh"></i> Última actualización: {new Date(inst.updatedAt||inst.createdAt).toLocaleString()}</div>
              </div>

              {/* Actividades */}
              <ul className="activities-detailed-list">
                {tpl.activities.map((act, i) => {
                  const completed = inst.completedActivities.includes(i);
                  // Si el backend guarda notas en inst.notes:
                  const note = inst.notes?.[i] ?? 'Sin notas';
                  return (
                    <li key={i} className={`activity-detail-item ${completed ? 'completed' : ''}`}>
                      <div className="activity-main">
                        <label>
                          <input type="checkbox" checked={completed} readOnly />
                          <span className="activity-name">{act.name}</span>
                        </label>
                        <div className="activity-info-icons">
                          <span><i className="fa fa-clock-o"></i> {act.minutes} min</span>
                          <span><i className="fa fa-star"></i> {act.challenge}</span>
                        </div>
                      </div>
                      {act.desc && <p className="activity-desc">{act.desc}</p>}
                      <div className="activity-notes-readonly">
                        <strong>Notas del paciente:</strong> {note}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
