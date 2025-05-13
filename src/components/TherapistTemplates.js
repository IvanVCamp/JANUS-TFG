// src/pages/RoutineTemplatesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/routineTemplates.css';

export default function RoutineTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [patients, setPatients]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch inicial de plantillas y pacientes
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    };

    Promise.all([
      fetch('/api/routines/templates', { headers }),
      fetch('/api/therapist/patients', { headers })
    ])
      .then(async ([resTpl, resPat]) => {
        if (resTpl.status === 401 || resPat.status === 401) {
          alert('Sesión expirada. Vuelve a iniciar sesión.');
          navigate('/login');
          return;
        }
        const dataTpl = await resTpl.json();
        const dataPat = await resPat.json();
        if (!Array.isArray(dataTpl) || !Array.isArray(dataPat)) {
          throw new Error('Respuesta inesperada del servidor');
        }
        setTemplates(dataTpl);
        setPatients(dataPat);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  // Drag start: guardamos tipo y payload
  const onDragStart = (e, item, type) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, item }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Drop genérico (basado en zona)
  const handleDrop = useCallback((e, zone) => {
    e.preventDefault();
    const { type, item } = JSON.parse(e.dataTransfer.getData('application/json'));

    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    };

    // Eliminar plantilla
    if (zone === 'trash' && type === 'template') {
      setTemplates(ts => ts.filter(t => t._id !== item._id));
      fetch(`/api/routinetemplates/${item._id}`, { method: 'DELETE', headers })
        .catch(console.error);
    }
    // Duplicar plantilla
    else if (zone === 'duplicate' && type === 'template') {
      const copy = { ...item, name: item.name + ' (copia)' };
      fetch('/api/routinetemplates', {
        method: 'POST',
        headers,
        body: JSON.stringify(copy)
      })
        .then(res => res.json())
        .then(newTpl => setTemplates(ts => [newTpl, ...ts]))
        .catch(console.error);
    }
    // Asignar a paciente
    else if (zone.startsWith('assign-') && type === 'template') {
      const patientId = zone.split('-')[1];
      fetch(`/api/patients/${patientId}/assignTemplate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ templateId: item._id })
      })
        .then(() => alert(`Plantilla «${item.name}» asignada a paciente ${patientId}`))
        .catch(console.error);
    }
  }, [token]);

  const allowDrop = e => e.preventDefault();

  if (loading) {
    return <div className="tpl-container">Cargando plantillas…</div>;
  }
  if (error) {
    return <div className="tpl-container">Error: {error}</div>;
  }

  return (
    <div className="routine-templates-page">
      <div className="tpl-container">
        <div className="tpl-header">
          <h1>Mis Plantillas</h1>
          <button
            className="btn-new"
            onClick={() => navigate('/therapist/templates/new')}
          >
            📄 Nueva plantilla
          </button>
        </div>

        {templates.length === 0 ? (
          <div
            className="empty-state"
            style={{
              border: '2px dashed var(--primary-color)',
              padding: '2rem',
              textAlign: 'center',
              borderRadius: '8px',
              color: 'var(--primary-color)',
              fontSize: '1.2rem',
              marginTop: '2rem'
            }}
          >
            🤔 Aún no se han creado plantillas
          </div>
        ) : (
          <div className="tpl-grid">
            {templates.map(t => (
              <div
                key={t._id}
                className="tpl-card"
                draggable
                onDragStart={e => onDragStart(e, t, 'template')}
              >
                <h2>{t.name}</h2>
                <p className="tpl-desc">{t.description}</p>
                <div className="tpl-meta">
                  {t.activities.length} actividades
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Papelera y duplicado */}
        <div
          className="dropzones"
          style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}
        >
          <div
            className="dropzone trash"
            onDragOver={allowDrop}
            onDrop={e => handleDrop(e, 'trash')}
          >
            🗑️ Arrastra aquí para eliminar
          </div>
          <div
            className="dropzone duplicate"
            onDragOver={allowDrop}
            onDrop={e => handleDrop(e, 'duplicate')}
          >
            📋 Arrastra aquí Ctrl+drag para duplicar
          </div>
        </div>

        {/* Lista de pacientes para asignar */}
        <h3 style={{ marginTop: '2rem' }}>Pacientes</h3>
        <div className="tpl-grid">
          {patients.map(p => (
            <div
              key={p._id}
              className="patient-card"
              onDragOver={allowDrop}
              onDrop={e => handleDrop(e, `assign-${p._id}`)}
            >
              <img
                src={p.avatar}
                alt={p.name}
                style={{ width: 40, borderRadius: '50%' }}
              />
              <div style={{ marginLeft: '0.5rem' }}>{p.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {p.email}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
