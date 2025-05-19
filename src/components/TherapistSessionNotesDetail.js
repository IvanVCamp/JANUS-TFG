// src/components/TherapistSessionNotesDetail.js

import React, { useState, useEffect } from 'react';
import axios                      from 'axios';
import { useParams, Link }        from 'react-router-dom';
import '../styles/routineTemplates.css';
import '../styles/therapistSessionNotes.css';

export default function TherapistSessionNotesDetail() {
  const { patientId } = useParams();
  const [notes, setNotes]         = useState([]);
  const [text, setText]           = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0,10));
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Nuevos estados para filtrado
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `/api/therapist/patients/${patientId}/notes`,
          { headers: { 'x-auth-token': token } }
        );
        setNotes(data);
      } catch (err) {
        setError('Error al cargar notas');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [patientId]);

  // Resumen de notas
  const totalNotes = notes.length;
  const lastSession = totalNotes
    ? new Date(notes[0].sessionDate).toLocaleDateString()
    : '—';

  // Filtrado de notas por fecha
  const filteredNotes = notes.filter(n => {
    const d = new Date(n.sessionDate).toISOString().slice(0,10);
    return (
      (!startDate || d >= startDate) &&
      (!endDate   || d <= endDate)
    );
  });

  // Exportar CSV
  const exportCSV = () => {
    const header = ['Fecha','Terapeuta','Contenido'];
    const rows = filteredNotes.map(n => [
      new Date(n.sessionDate).toLocaleDateString(),
      `${n.therapist.nombre} ${n.therapist.apellidos}`,
      `"${n.content.replace(/"/g,'""')}"`
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link= document.createElement('a');
    link.href = url;
    link.download = `notas_${patientId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Guardar nota nueva
  const saveNote = async () => {
    const token = localStorage.getItem('token');
    const payload = { content: text, sessionDate: date };
    const { data } = await axios.post(
      `/api/therapist/patients/${patientId}/notes`,
      payload,
      { headers: { 'x-auth-token': token } }
    );
    setNotes([data, ...notes]);
    setText('');
  };

  if (loading) return <p>Cargando notas…</p>;
  if (error)   return <p className="error-msg">{error}</p>;

  return (
    <div className="therapist-session-notes-detail">
      {/* Encabezado */}
      <div className="detail-header">
        <Link to="/therapist/session-notes" className="back-link">← Volver</Link>
        <h1>Notas de Sesión</h1>
      </div>

      {/* Información contextual */}
      <section className="context-comments">
        <h2>Información Contextual</h2>
        <p>
          <strong>Total de notas:</strong> {totalNotes} &nbsp;|&nbsp;
          <strong>Última sesión:</strong> {lastSession}
        </p>
        <p>
          Historial de sesiones, objetivos terapéuticos y recomendaciones generales
          se mostrarán aquí para orientar la elaboración de nuevas notas.
        </p>
      </section>

      {/* Filtros y export */}
      <div className="filter-export-bar">
        <div className="date-filter">
          <label>
            Desde&nbsp;
            <input type="date" value={startDate}
                   onChange={e=>setStartDate(e.target.value)} />
          </label>
          <label>
            Hasta&nbsp;
            <input type="date" value={endDate}
                   onChange={e=>setEndDate(e.target.value)} />
          </label>
        </div>
        <button className="export-btn" onClick={exportCSV}>
          <i className="fa fa-download"></i> Exportar CSV
        </button>
      </div>

      {/* Formulario para nueva nota */}
      <div className="new-note-form">
        <label>
          Fecha de sesión
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </label>
        <label>
          Observaciones / Sugerencias
          <textarea
            rows="4"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe aquí tu nota…"
          />
        </label>
        <button onClick={saveNote} disabled={!text.trim()}>
          <i className="fa fa-plus"></i> Añadir Nota
        </button>
      </div>

      {/* Listado de notas filtradas */}
      <ul className="notes-list">
        {filteredNotes.map(n => (
          <li key={n._id} className="note-item">
            <div className="note-meta">
              <span className="note-date">
                <i className="fa fa-calendar"></i> {new Date(n.sessionDate).toLocaleDateString()}
              </span>
              <span className="note-author">
                <i className="fa fa-user-md"></i> {n.therapist.nombre} {n.therapist.apellidos}
              </span>
              <span className="note-updated">
                <i className="fa fa-clock-o"></i> {new Date(n.updatedAt).toLocaleString()}
              </span>
            </div>
            <p className="note-content">{n.content}</p>
          </li>
        ))}
      </ul>

      {/* Quick-note */}
      <div className="quick-note">
        <input type="text" placeholder="Añadir comentario rápido…" />
        <button><i className="fa fa-sticky-note"></i> Guardar</button>
      </div>
    </div>
  );
}
