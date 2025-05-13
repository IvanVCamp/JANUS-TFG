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

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const addActivity = () => {
    setForm(f => ({
      ...f,
      activities: [...f.activities, {
        id: Date.now(),
        name: '', desc: '', challenge: 'Bajo', minutes: 10
      }]
    }));
  };
  const updateActivity = (id, field, val) => {
    setForm(f => ({
      ...f,
      activities: f.activities.map(a => a.id === id ? { ...a, [field]: val } : a)
    }));
  };
  const removeActivity = id => {
    setForm(f => ({
      ...f,
      activities: f.activities.filter(a => a.id !== id)
    }));
  };

  // Drag & drop reorder
  const onDragStart = (e, idx) => e.dataTransfer.setData('text/plain', idx);
  const onDrop = (e, idx) => {
    const from = +e.dataTransfer.getData('text/plain');
    if (from === idx) return;
    setForm(f => {
      const list = [...f.activities];
      const [m] = list.splice(from, 1);
      list.splice(idx, 0, m);
      return { ...f, activities: list };
    });
  };
  const allowDrop = e => e.preventDefault();

  // Tags
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) handleChange('tags', [...form.tags, t]);
    setTagInput('');
  };
  const removeTag = t => handleChange('tags', form.tags.filter(x => x !== t));

  const token = localStorage.getItem('token');
  const res = fetch('/api/routinetemplates', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-auth-token': token    // ← aquí pasamos el JWT
     },
     body: JSON.stringify(form)
   });

  return (
    <div className="routine-templates-page">
      <div className="tpl-container tpl-form landscape">
        <h2>Crear Nueva Plantilla</h2>
        {/* Grid contenedor apaisado */}
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre</label>
            <input value={form.name}
              onChange={e=>handleChange('name', e.target.value)}
              placeholder="Ej. Rutina matutina" />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select value={form.category}
              onChange={e=>handleChange('category', e.target.value)}>
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
              onChange={e=>handleChange('description', e.target.value)}
              rows={3}
              placeholder="Objetivo de la plantilla" />
          </div>
          <div className="form-group">
            <label>Duración (min)</label>
            <input type="number" min={5}
              value={form.duration}
              onChange={e=>handleChange('duration', +e.target.value)} />
          </div>
          <div className="form-group">
            <label>Recordatorio</label>
            <select value={form.reminder}
              onChange={e=>handleChange('reminder', e.target.value)}>
              <option value="none">Sin recordatorio</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
          <div className="form-group tag-group">
            <label>Tags</label>
            <div className="tag-input-group">
              <input value={tagInput}
                onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())}
                placeholder="Añadir tag" />
              <button className="btn-new" onClick={addTag}><FaPlus/></button>
            </div>
            <div className="tags-list">
              {form.tags.map(t=>(
                <span key={t} className="tag-pill">
                  {t} <FaTrash onClick={()=>removeTag(t)} />
                </span>
              ))}
            </div>
          </div>
        </div> {/* end form-grid */}

        {/* Actividades horizontal scroll */}
        <hr />
        <div className="activities-controls">
          <h3>Actividades</h3>
          <button className="btn-new" onClick={addActivity}>
            <FaPlus /> Añadir</button>
        </div>
        <div className="activities-list horizontal-scroll">
          {form.activities.map((act, idx) => (
            <div key={act.id}
                 className="activity-item landscape"
                 draggable
                 onDragStart={e=>onDragStart(e,idx)}
                 onDragOver={allowDrop}
                 onDrop={e=>onDrop(e,idx)}>
              <FaGripVertical className="drag-handle"/>
              <input className="small-input"
                     value={act.name}
                     onChange={e=>updateActivity(act.id,'name',e.target.value)}
                     placeholder="Actividad" />
              <select className="small-select"
                      value={act.challenge}
                      onChange={e=>updateActivity(act.id,'challenge',e.target.value)}>
                <option>Bajo</option>
                <option>Medio</option>
                <option>Alto</option>
              </select>
              <input type="number"
                     className="small-input"
                     style={{width:'4rem'}}
                     value={act.minutes}
                     onChange={e=>updateActivity(act.id,'minutes',+e.target.value)}/>
              <FaTrash className="remove-ico" onClick={()=>removeActivity(act.id)}/>
            </div>
          ))}
        </div>

        <button className="btn-save" onClick={submit}>
          💾 Guardar
        </button>
      </div>
    </div>
  );
}