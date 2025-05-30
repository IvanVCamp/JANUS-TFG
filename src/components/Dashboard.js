// src/components/Dashboard.js

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate }                       from 'react-router-dom'
import Calendar                              from 'react-calendar'
import axios                                 from 'axios'
import 'react-calendar/dist/Calendar.css'
import defaultProfile                        from '../assets/default-profile.png'
import '../styles/home.css'
import '../styles/taskPlanner.css'

function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}
function getUserId() {
  const raw = localStorage.getItem('token')
  if (!raw) return null
  const token  = raw.startsWith('Bearer ') ? raw.slice(7) : raw
  const payload = decodeJwt(token)
  return payload?.id || payload?.sub || payload?.user?.id || null
}

export default function Dashboard() {
  const navigate             = useNavigate()
  const [selectedDate, setSelectedDate]         = useState(new Date())
  const [showPanel, setShowPanel]                = useState(false)
  const [showModal, setShowModal]                = useState(false)
  const [showManage, setShowManage]              = useState(false)
  const [showProfileModal, setShowProfileModal]  = useState(false)
  const [tasks, setTasks]                        = useState([])
  const [upcoming, setUpcoming]                  = useState([])
  const [expiredReminders, setExpiredReminders]  = useState([])
  const [countdowns, setCountdowns]              = useState({})
  const [newTitle, setNewTitle]                  = useState('')
  const [newDateTime, setNewDateTime]            = useState('')
  const [editStates, setEditStates]              = useState({})
  const timerRef                                = useRef()
  const [profilePic, setProfilePic]              = useState(defaultProfile)

  useEffect(() => {
    const saved = localStorage.getItem('profilePicPatient')
    if (saved) setProfilePic(saved)
    else {
      const token = localStorage.getItem('token')
      axios.get('/api/users/me', {
        headers: { 'x-auth-token': token }
      }).then(({ data }) => {
        setProfilePic(data.avatar || defaultProfile)
      }).catch(console.error)
    }
  }, [])

  const handleProfileClick = () => setShowProfileModal(true)

  const handleProfileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const formData = new FormData()
    formData.append('avatar', file)
    const token = localStorage.getItem('token')
    axios.put('/api/users/me/avatar', formData, {
      headers: {
        'x-auth-token': token
      }
    }).then(({ data }) => {
      setProfilePic(data.avatar)
      localStorage.setItem('profilePicPatient', data.avatar)
      setShowProfileModal(false)
    }).catch(console.error)
  }

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token')
      const userId = getUserId()
      if (!token || !userId) return
      try {
        const { data } = await axios.get('/api/tasks', {
          headers: { 'x-auth-token': token }
        })
        const all = Array.isArray(data) ? data : []
        setTasks(all)
        const now = Date.now()
        setExpiredReminders(
          all.filter(t => new Date(t.startTime).getTime() <= now)
             .sort((a,b)=> new Date(b.startTime) - new Date(a.startTime))
        )
        setUpcoming(
          all.filter(t => new Date(t.startTime).getTime() > now)
             .sort((a,b)=> new Date(a.startTime) - new Date(b.startTime))
        )
      } catch (err) {
        console.error('Error cargando tareas:', err)
      }
    }
    fetchTasks()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!upcoming.length) return
    const updateCounts = () => {
      const now = Date.now()
      const counts = {}
      upcoming.forEach(t => {
        const diff = new Date(t.startTime).getTime() - now
        if (diff > 0) {
          const d = String(Math.floor(diff / 86400000)).padStart(2,'0')
          const h = String(Math.floor((diff % 86400000)/3600000)).padStart(2,'0')
          const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,'0')
          const s = String(Math.floor((diff % 60000)/1000)).padStart(2,'0')
          counts[t._id] = `${d}:${h}:${m}:${s}`
        } else {
          counts[t._id] = '00:00:00:00'
        }
      })
      setCountdowns(counts)
    }
    updateCounts()
    timerRef.current = setInterval(updateCounts, 1000)
    return () => clearInterval(timerRef.current)
  }, [upcoming])

  const handleCreate = async () => {
    const token = localStorage.getItem('token')
    if (!newTitle || !newDateTime || !token) return
    try {
      await axios.post(
        '/api/tasks',
        { title: newTitle, startTime: newDateTime, endTime: newDateTime },
        { headers: { 'x-auth-token': token } }
      )
      setNewTitle(''); setNewDateTime(''); setShowModal(false)
      const { data } = await axios.get('/api/tasks', {
        headers: { 'x-auth-token': token }
      })
      const all = Array.isArray(data) ? data : []
      setTasks(all)
      const now = Date.now()
      setExpiredReminders(all.filter(t=> new Date(t.startTime)<=now))
      setUpcoming(all.filter(t=> new Date(t.startTime)>now))
    } catch (err) {
      console.error('Error creando recordatorio:', err)
    }
  }

  const openManage = () => {
    const init = {}
    tasks.forEach(t => {
      init[t._id] = { title: t.title, datetime: t.startTime.slice(0,16) }
    })
    setEditStates(init)
    setShowManage(true)
  }

  const handleEdit = async id => {
    const token = localStorage.getItem('token')
    const { title, datetime } = editStates[id]||{}
    if (!title||!datetime) return
    try {
      await axios.put(
        `/api/tasks/${id}`,
        { title, startTime: datetime, endTime: datetime },
        { headers: { 'x-auth-token': token } }
      )
      const { data } = await axios.get('/api/tasks', {
        headers: { 'x-auth-token': token }
      })
      const all = Array.isArray(data)? data : []
      setTasks(all)
      const now = Date.now()
      setExpiredReminders(all.filter(t=> new Date(t.startTime)<=now))
      setUpcoming(all.filter(t=> new Date(t.startTime)>now))
    } catch (err) {
      console.error('Error editando recordatorio:', err)
    }
  }

  const handleDelete = async id => {
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`/api/tasks/${id}`, {
        headers: { 'x-auth-token': token }
      })
      setTasks(ts=> ts.filter(t=>t._id!==id))
      setExpiredReminders(er=> er.filter(t=>t._id!==id))
      setUpcoming(up=> up.filter(t=>t._id!==id))
    } catch (err) {
      console.error('Error eliminando recordatorio:', err)
    }
  }

  const tileContent = ({ date, view }) => {
    if (view==='month') {
      const day = date.toISOString().slice(0,10)
      const has = upcoming.some(t=>t.startTime.slice(0,10)===day)
               || expiredReminders.some(t=>t.startTime.slice(0,10)===day)
      return has ? <div className="task-dot" /> : null
    }
    return null
  }

  const togglePanel = () => setShowPanel(v=>!v)
  const handleDateChange = date => setSelectedDate(date)

  return (
    <div className="home-container">
      <header className="top-bar">
        <div className="left-section">
          <img
            src={profilePic}
            alt="Perfil"
            className="user-icon"
            onClick={handleProfileClick}
          />
        </div>
        <div className="center-section">
          <h1 className="title">JANUS</h1>
        </div>
        <div className="right-section">
          <div className="notification-wrapper" onClick={togglePanel}>
            <i className="fa fa-bell bell-icon" />
            {expiredReminders.length>0 && <span className="notification-dot" />}
          </div>
          <button className="logout-btn" onClick={()=>navigate('/')}>
            <i className="fa fa-sign-out" /><span>Salir</span>
          </button>
        </div>
      </header>

      {showProfileModal && (
        <div className="modal-overlay profile-modal">
          <div className="modal-content profile-modal-content">
            <h2>Actualizar foto de perfil</h2>
            <img src={profilePic} alt="Actual" className="current-profile" />
            <input type="file" accept="image/*" onChange={handleProfileChange} />
            <button onClick={()=>setShowProfileModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {showPanel && (
        <div className="notification-panel">
          <h3>Próximas actividades</h3>
          {upcoming.length===0
            ? <p>No hay actividades programadas.</p>
            : upcoming.map(t=>(
                <div key={t._id} className="notification-item">
                  <div className="notif-title">{t.title}</div>
                  <div className="notif-countdown">{countdowns[t._id]}</div>
                </div>
              ))
          }
        </div>
      )}

      <main className="main-content">
        <section className="intro-section">
          <h2>¡Bienvenido/a a JANUS!</h2>
          <p>Explora las opciones o gestiona tus recordatorios:</p>
          <button className="create-task-btn" onClick={()=>setShowModal(true)}>
            <i className="fa fa-plus" /> Añadir recordatorio
          </button>
          <button className="manage-btn" onClick={openManage}>
            <i className="fa fa-cog" /> Gestionar Recordatorios
          </button>
        </section>

        <div className="buttons-and-calendar">
          <div className="buttons-block">
            <button className="option-btn" onClick={()=>navigate('/messaging')}>
              <i className="fa fa-comments icon" /> Mensajería
            </button>
            <button className="option-btn" onClick={()=>navigate('/time-machine-game')}>
              <i className="fa fa-clock-o icon" /> Máquina del Tiempo
            </button>
            <button className="option-btn" onClick={()=>navigate('/mi-planeta')}>
              <i className="fa fa-globe icon" /> Mi Planeta
            </button>
            <button className="option-btn" onClick={()=>navigate('/patient/templates')}>
              <i className="fa fa-folder-open icon" /> Mis Plantillas
            </button>
            <button className="option-btn" onClick={()=>navigate('/diario-de-emociones')}>
              <i className="fa fa-book icon" /> Mi diario de emociones
            </button>
          </div>
          <div className="calendar-block">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={tileContent}
            />
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nuevo Recordatorio</h2>
            <div className="create-task-form">
              <label>
                Título
                <input
                  type="text"
                  value={newTitle}
                  onChange={e=>setNewTitle(e.target.value)}
                />
              </label>
              <label>
                Fecha y hora
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={e=>setNewDateTime(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleCreate}>Guardar</button>
              <button className="cancel-btn" onClick={()=>setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showManage && (
        <div className="modal-overlay">
          <div className="modal-content manage-content">
            <h2>Gestionar Recordatorios</h2>
            {tasks.length===0 ? (
              <p>No tienes recordatorios.</p>
            ) : (
              <ul className="manage-list">
                {tasks.map(t => {
                  const { title, datetime } = editStates[t._id]||{}
                  return (
                    <li key={t._id} className="manage-item">
                      <input
                        value={title||''}
                        onChange={e=>{
                          setEditStates(es=>({
                            ...es,[t._id]:{...es[t._id],title:e.target.value}
                          }))
                        }}
                      />
                      <input
                        type="datetime-local"
                        value={datetime||''}
                        onChange={e=>{
                          setEditStates(es=>({
                            ...es,[t._id]:{...es[t._id],datetime:e.target.value}
                          }))
                        }}
                      />
                      <div className="manage-actions">
                        <button onClick={()=>handleEdit(t._id)}>Guardar</button>
                        <button onClick={()=>handleDelete(t._id)}>Eliminar</button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <button className="cancel-btn" onClick={()=>setShowManage(false)}>Cerrar</button>
          </div>
        </div>
      )}

      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  )
}
