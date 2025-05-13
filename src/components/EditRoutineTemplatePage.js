// src/pages/EditRoutineTemplatePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/routineTemplates.css';
import { FaGripVertical, FaPlus, FaTrash } from 'react-icons/fa';

export default function EditRoutineTemplatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [tagInput, setTagInput] = useState('');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'x-auth-token': token
  };

  // Load template to edit
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetch(`/api/routines/templates/${id}`, { headers })
      .then(res => {
        if (res.status === 401) throw new Error('Sesión expirada');
        if (!res.ok) throw new Error(`Plantilla no encontrada (${res.status})`);
        return res.json();
      })
      .then(tpl => {
        // Map activities, adding a temp id for drag&drop
        const acts = tpl.activities.map((a, idx) => ({
          id: Date.now() + idx,
          name: a.name,
          desc: a.desc,
          challenge: a.challenge,
          minutes: a.minutes
        }));
        setForm({
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          tags: tpl.tags,
          duration: tpl.duration,
          reminder: tpl.reminder,
          activities: acts
        });
      })
      .catch(err => {
        console.error(err);
        navigate('/therapist/templates');
      });
  }, [id, navigate, token]);

  if (form === null) {
    return <div className="tpl-container">Cargando plantilla…</div>;
  }

  // Simple field change
  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  // Tags
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      handleChange('tags', [...form.tags, t]);
    }
    setTagInput('');
  };
  const removeTag = t => {
    handleChange('tags', form.tags.filter(x => x !== t));
  };

  // Activities
  const addActivity = () => {
    setForm(f => ({
      ...f,
      activities: [
        ...f.activities,
        { id: Date.now(), name: '', desc: '', challenge: 'Bajo', minutes: 10 }
      ]
    }));
  };
  const updateActivity = (idAct, field, value) => {
    setForm(f => ({
      ...f,
      activities: f.activities.map(a =>
        a.id === idAct ? { ...a, [field]: value } : a
      )
    }));
  };
  const removeActivity = idAct => {
    setForm(f => ({
      ...f,
      activities: f.activities.filter(a => a.id !== idAct)
    }));
  };

  // Drag & drop reorder
  const onDragStart = (e, idx) => {
    e.dataTransfer.setData('text/plain', idx);
  };
  const onDrop = (e, idx) => {
    e.preventDefault();
    const from = +e.dataTransfer.getData('text/plain');
    if (from === idx) return;
    setForm(f => {
      const list = [...f.activities];
      const [moved] = list.splice(from, 1);
      list.splice(idx, 0, moved);
      return { ...f, activities: list };
    });
  };
  const allowDrop = e => e.preventDefault();

  // Submit updates
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        tags: form.tags,
        duration: form.duration,
        reminder: form.reminder,
        activities: form.activities.map(a => ({
          name: a.name,
          desc: a.desc,
          challenge: a.challenge,
          minutes: a.minutes
        }))
      };
      const res = await fetch(`/api/routines/templates/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        alert('Sesión expirada');
        return navigate('/login');
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }
      navigate('/therapist/templates');
    } catch (err) {
      console.error('Error actualizando plantilla:', err);
      alert('No se pudo actualizar la plantilla:\n' + err.message);
    }
  };

  return (
    <div className="routine-templates-page">
      <form
        className="tpl-container tpl-form landscape"
        onSubmit={handleSubmit}
      >
        <h2>Editar Plantilla</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Nombre</label>
            <input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
            >
              <option value="">— Selecciona —</option>
              <option>Relajación</option>
              <option>Ejercicio Físico</option>
              <option>Mindfulness</option>
              <option>Hábito Saludable</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duración (min)</label>
            <input
              type="number"
              min={5}
              value={form.duration}
              onChange={e => handleChange('duration', +e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Recordatorio</label>
            <select
              value={form.reminder}
              onChange={e => handleChange('reminder', e.target.value)}
            >
              <option value="none">Sin recordatorio</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
          <div className="form-group tag-group">
            <label>Tags</label>
            <div className="tag-input-group">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
                placeholder="Añadir tag"
              />
              <button
                type="button"
                className="btn-new"
                onClick={addTag}
              >
                <FaPlus />
              </button>
            </div>
            <div className="tags-list">
              {form.tags.map(t => (
                <span key={t} className="tag-pill">
                  {t}{' '}
                  <FaTrash
                    onClick={() => removeTag(t)}
                    style={{ cursor: 'pointer' }}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        <hr />

        <div className="activities-controls">
          <h3>Actividades</h3>
          <button
            type="button"
            className="btn-new"
            onClick={addActivity}
          >
            <FaPlus /> Añadir Actividad
          </button>
        </div>

        <div className="activities-list horizontal-scroll">
          {form.activities.map((act, idx) => (
            <div
              key={act.id}
              className="activity-item landscape"
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={allowDrop}
              onDrop={e => onDrop(e, idx)}
            >
              <FaGripVertical className="drag-handle" />
              <input
                className="small-input"
                value={act.name}
                onChange={e =>
                  updateActivity(act.id, 'name', e.target.value)
                }
                placeholder="Nombre actividad"
              />
              <input
                className="small-input"
                value={act.desc}
                onChange={e =>
                  updateActivity(act.id, 'desc', e.target.value)
                }
                placeholder="Descripción breve"
              />
              <select
                className="small-select"
                value={act.challenge}
                onChange={e =>
                  updateActivity(act.id, 'challenge', e.target.value)
                }
              >
                <option>Bajo</option>
                <option>Medio</option>
                <option>Alto</option>
              </select>
              <input
                type="number"
                className="small-input"
                style={{ width: '4rem' }}
                value={act.minutes}
                onChange={e =>
                  updateActivity(act.id, 'minutes', +e.target.value)
                }
              />
              <FaTrash
                className="remove-ico"
                onClick={() => removeActivity(act.id)}
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-save">
          💾 Actualizar Plantilla
        </button>
      </form>
    </div>
  );
}
