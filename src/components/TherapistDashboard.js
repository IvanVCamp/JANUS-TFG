// src/components/TherapistDashboardHome.js

import React, { useState, useEffect } from 'react'
import { useNavigate }                  from 'react-router-dom'
import Calendar                         from 'react-calendar'
import axios                            from 'axios'
import defaultProfile                   from '../assets/default-profile.png'
import '../styles/therapistDashboard.css'

export default function TherapistDashboardHome() {
  const navigate               = useNavigate()
  const [selectedDate, setSelectedDate]     = useState(new Date())
  const [showModal, setShowModal]           = useState(false)
  const [inviteEmail, setInviteEmail]       = useState('')
  const [inviteMsg, setInviteMsg]           = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profilePic, setProfilePic]         = useState(defaultProfile)
  const [fileError, setFileError]           = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get('/api/users/me', {
      headers: { 'x-auth-token': token }
    }).then(({ data }) => {
      setProfilePic(data.avatar || defaultProfile)
    }).catch(console.error)
  }, [])

  const handleProfileClick = () => {
    setShowProfileModal(true)
    setFileError('')
  }

  const handleProfileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFileError('Sólo imágenes permitidas')
      return
    }
    const formData = new FormData()
    formData.append('avatar', file)
    const token = localStorage.getItem('token')
    axios.put('/api/users/me/avatar', formData, {
      headers: {
        'x-auth-token': token
      }
    }).then(({ data }) => {
      setProfilePic(data.avatar)
      setShowProfileModal(false)
    }).catch(err => {
      console.error(err)
      setFileError('Error subiendo imagen')
    })
  }

  const handleInvitationSubmit = async () => {
    const emailTrimmed = inviteEmail.trim()
    if (!emailTrimmed) {
      setInviteMsg('Por favor, ingresa un correo electrónico válido.')
      return
    }
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        '/api/invitations',
        { invitedEmail: emailTrimmed },
        { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } }
      )
      setInviteMsg('Invitación enviada con éxito.')
      setShowModal(false)
      setInviteEmail('')
    } catch (err) {
      console.error(err.response?.data)
      setInviteMsg(err.response?.data?.msg || 'Error al enviar la invitación.')
    }
  }

  const handleLogout = () => {
    navigate('/')
  }

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
          <h1 className="title">Dashboard Terapeuta</h1>
        </div>
        <div className="right-section">
          <i className="fa fa-bell bell-icon" aria-hidden="true"></i>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fa fa-sign-out" aria-hidden="true"></i>
            <span>Salir</span>
          </button>
        </div>
      </header>

      {showProfileModal && (
        <div className="modal-overlay profile-modal">
          <div className="modal-content profile-modal-content">
            <h2>Actualizar foto de perfil</h2>
            <img src={profilePic} alt="Actual" className="current-profile" />
            <input type="file" accept="image/*" onChange={handleProfileChange} />
            {fileError && <p className="error-msg">{fileError}</p>}
            <div className="modal-buttons">
              <button onClick={() => setShowProfileModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <section className="intro-section">
          <h2>¡Bienvenido, Terapeuta!</h2>
          <p>Accede a tus herramientas y consulta la información estadística de tus pacientes.</p>
        </section>
        <div className="buttons-and-calendar">
          <div className="buttons-block">
            <div className="button-group">
              <h3>HERRAMIENTAS DE GESTIÓN</h3>
              <button className="option-btn" onClick={() => navigate('/therapist/patients')}>
                <i className="fa fa-users icon"></i>
                Lista de Pacientes
              </button>
              <button className="option-btn" onClick={() => navigate('/messaging')}>
                <i className="fa fa-comments icon"></i>
                Mensajería
              </button>
              <button className="option-btn" onClick={() => setShowModal(true)}>
                <i className="fa fa-envelope icon"></i>
                Generar Invitación
              </button>
              <button className="option-btn" onClick={() => navigate('/therapist/templates')}>
                <i className="fa fa-file-text icon"></i>
                Plantillas
              </button>
              <button className="option-btn" onClick={() => navigate('/therapist/session-notes')}>
                <i className="fa fa-sticky-note-o icon"></i>
                Notas de Sesión
              </button>
            </div>
            <div className="button-group">
              <h3>INFORMACIÓN ESTADÍSTICA</h3>
              <button className="option-btn" onClick={() => navigate('/therapist/routines')}>
                <i className="fa fa-clock-o icon"></i>
                Rutinas y Tiempo
              </button>
              <button className="option-btn" onClick={() => navigate('/therapist/interests')}>
                <i className="fa fa-line-chart icon"></i>
                Intereses
              </button>
              <button className="option-btn" onClick={() => navigate('/therapist/satisfaction')}>
                <i className="fa fa-smile-o icon"></i>
                Satisfacción
              </button>
            </div>
          </div>
          <div className="calendar-block">
            <Calendar onChange={setSelectedDate} value={selectedDate} />
          </div>
        </div>
      </main>

      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generar Invitación</h2>
            <p>Introduce el correo electrónico del paciente:</p>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="paciente@ejemplo.com"
            />
            <div className="modal-buttons">
              <button onClick={handleInvitationSubmit}>Enviar Invitación</button>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
            {inviteMsg && <p className="invite-msg">{inviteMsg}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
