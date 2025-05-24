// src/pages/RoutineTemplatesPage.js

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link }                    from 'react-router-dom'
import { FaTrash, FaEdit, FaEye }         from 'react-icons/fa'
import defaultProfile                     from '../assets/default-profile.png'
import '../styles/routineTemplates.css'

export default function RoutineTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [patients, setPatients]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const navigate                  = useNavigate()
  const token                     = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      setLoading(false)
      return
    }
    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
    Promise.all([
      fetch('/api/routines/templates', { headers }),
      fetch('/api/therapist/patients',   { headers })
    ])
      .then(async ([resTpl, resPat]) => {
        if (resTpl.status === 401 || resPat.status === 401) {
          setLoading(false)
          alert('Sesión expirada. Vuelve a iniciar sesión.')
          navigate('/login')
          return
        }
        const dataTpl = await resTpl.json()
        const dataPat = await resPat.json()
        if (!Array.isArray(dataTpl) || !Array.isArray(dataPat)) {
          throw new Error('Respuesta inesperada del servidor')
        }
        setTemplates(dataTpl)
        setPatients(dataPat)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [navigate, token])

  const onDragStart = (e, item, type) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type, item })
    )
    e.dataTransfer.effectAllowed = 'copyMove'
  }

  const allowDrop = e => e.preventDefault()

  const handleDrop = useCallback((e, zone) => {
    e.preventDefault()
    const { type, item } = JSON.parse(
      e.dataTransfer.getData('application/json')
    )
    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
    if (zone === 'trash' && type === 'template') {
      setTemplates(ts => ts.filter(t => t._id !== item._id))
      fetch(`/api/routines/templates/${item._id}`, {
        method: 'DELETE',
        headers
      }).catch(console.error)
    }
    else if (zone === 'duplicate' && type === 'template') {
      const payload = {
        name:        item.name + ' (copia)',
        description: item.description,
        tags:        item.tags,
        duration:    item.duration,
        activities:  item.activities.map(a => ({
          name:      a.name,
          desc:      a.desc,
          challenge: a.challenge,
          minutes:   a.minutes
        }))
      }
      fetch('/api/routines/templates', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(newTpl => setTemplates(ts => [newTpl, ...ts]))
        .catch(err => {
          console.error('Error duplicando plantilla:', err)
          alert('No se pudo duplicar: ' + err.message)
        })
    }
    else if (zone.startsWith('assign-') && type === 'template') {
      const patientId = zone.split('-')[1]
      fetch('/api/routines/instances', {
        method: 'POST',
        headers,
        body: JSON.stringify({ templateId: item._id, patientId })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          alert(`«${item.name}» asignada a ${patientId}`)
        })
        .catch(err => {
          console.error('Error asignando plantilla:', err)
          alert('No se pudo asignar: ' + err.message)
        })
    }
  }, [token])

  if (loading) {
    return <div className="tpl-container">Cargando plantillas…</div>
  }
  if (error) {
    return <div className="tpl-container">Error: {error}</div>
  }

  return (
    <div className="routine-templates-page">
      <div className="tpl-container">
        <div className="tpl-header">
          <Link to="/therapist" className="back-link">← Volver</Link>
          <h1>Mis Plantillas</h1>
          <button className="btn-new" onClick={() => navigate('/therapist/templates/new')}>
            📄 Nueva plantilla
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="empty-state">
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
                <FaEdit
                  className="icon-edit"
                  onClick={() =>
                    navigate(`/therapist/templates/${t._id}/edit`)
                  }
                />
                <h2>{t.name}</h2>
                <p className="tpl-desc">{t.description}</p>
                <div className="tpl-meta">
                  {t.activities.length} actividades
                  <span
                    className="detail-link"
                    onClick={() => navigate(`/therapist/templates/${t._id}`)}
                    title="Ver detalle de plantilla"
                  >
                    <FaEye />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="dropzones">
          <div
            className="dropzone trash"
            onDragOver={allowDrop}
            onDrop={e => handleDrop(e, 'trash')}
          >
            🗑️ Eliminar plantilla
          </div>
          <div
            className="dropzone duplicate"
            onDragOver={allowDrop}
            onDrop={e => handleDrop(e, 'duplicate')}
          >
            📋 Duplicar plantilla
          </div>
        </div>

        <h3>Pacientes</h3>
        <div className="tpl-grid">
          {patients.map(p => (
            <div
              key={p._id}
              className="patient-card"
              draggable
              onDragOver={allowDrop}
              onDrop={e => handleDrop(e, `assign-${p._id}`)}
            >
              <img
                src={p.avatar || defaultProfile}
                alt={`${p.nombre} avatar`}
                className="patient-avatar"
              />
              <div className="patient-info">
                <strong>
                  {p.nombre} {p.apellidos}
                </strong>
                <small>{p.email}</small>
              </div>
              <FaEye
                className="icon-eye"
                title="Ver detalle de paciente"
                onClick={() => navigate(`/therapist/templates/patient/${p._id}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
