// src/pages/NewRoutineTemplatePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/routineTemplates.css';
import { FaGripVertical, FaPlus, FaTrash } from 'react-icons/fa';

export default function NewRoutineTemplatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: [],
    duration: 30,
    reminder: 'none',
    activities: []
  });
  const [tagInput, setTagInput] = useState('');

  // Helpers para el formulario
  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };
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

  // Helpers para actividades
  const addActivity = () => {
    setForm(f => ({
      ...f,
      activities: [
        ...f.activities,
        { id: Date.now(), name: '', desc: '', challenge: 'Bajo', minutes: 10 }
      ]
    }));
  };
  const updateActivity = (id, field, val) => {
    setForm(f => ({
      ...f,
      activities: f.activities.map(a =>
        a.id === id ? { ...a, [field]: val } : a
      )
    }));
  };
  const removeActivity = id => {
    setForm(f => ({
      ...f,
      activities: f.activities.filter(a => a.id !== id)
    }));
  };
  const onDragStart = (e, idx) => e.dataTransfer.setData('text/plain', idx);
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

  // Envía el formulario, limpiando cualquier _id de subdocumentos
  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión.');
      return navigate('/login');
    }

    // Construimos el payload sin campos _id
    const payload = {
      name:        form.name,
      description: form.description,
      category:    form.category,
      tags:        form.tags,
      duration:    form.duration,
      reminder:    form.reminder,
      activities:  form.activities.map(({ name, desc, challenge, minutes }) => ({
        name, desc, challenge, minutes
      }))
    };

    try {
      const res = await fetch('/api/routines/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        alert('Sesión expirada. Inicia sesión de nuevo.');
        return navigate('/login');
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }
      // Éxito: volvemos al listado
      navigate('/therapist/templates');
    } catch (err) {
      console.error('Error guardando plantilla:', err);
      alert('No se pudo guardar la plantilla:\n' + err.message);
    }
  };

  return (
    <div className="routine-templates-page">
      <form
        className="tpl-container tpl-form landscape"
        onSubmit={handleSubmit}
      >
        <h2>Crear Nueva Plantilla</h2>

        {/* Grid apaisado */}
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre</label>
            <input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Ej. Rutina matutina"
              required
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
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Objetivo de la plantilla"
            />
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

        {/* Actividades en scroll horizontal */}
        <div className="activities-controls">
          <h3>Actividades</h3>
          <button
            type="button"
            className="btn-new"
            onClick={addActivity}
          >
            <FaPlus /> Añadir
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
                placeholder="Actividad"
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
          💾 Guardar
        </button>
      </form>
    </div>
  );
}
