import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../services/chatService';
import '../styles/messaging.css';

function Messaging() {
  const navigate = useNavigate();

  // Estado local
  const [chats, setChats] = useState([]);          // Lista de chats
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);     // Mensajes del chat seleccionado
  const [searchQuery, setSearchQuery] = useState(''); // Para buscar usuarios
  const [newMessage, setNewMessage] = useState('');   // Texto del mensaje
  const [file, setFile] = useState(null);            // Archivo a adjuntar

  // Cargar la lista de chats al montar
  useEffect(() => {
    async function fetchChats() {
      try {
        const data = await chatService.getChats();
        setChats(data);
      } catch (err) {
        console.error('Error obteniendo chats:', err);
      }
    }
    fetchChats();
  }, []);

  // Cargar mensajes cuando se seleccione un chat
  useEffect(() => {
    if (selectedChatId) {
      async function fetchMessages() {
        try {
          const data = await chatService.getMessages(selectedChatId);
          setMessages(data);
        } catch (err) {
          console.error('Error obteniendo mensajes:', err);
        }
      }
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  // Manejo de selección de chat
  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  // Manejo de búsqueda de usuarios (al presionar Enter)
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      try {
        // Buscar usuarios
        const usersFound = await chatService.searchUsers(searchQuery.trim());
        // Ejemplo: si el primer usuario es con quien iniciarás chat
        if (usersFound.length > 0) {
          const newChatUser = usersFound[0];
          const newChat = await chatService.startChat(newChatUser.id);
          // Actualizar lista de chats
          setChats([...chats, newChat]);
          setSelectedChatId(newChat.id);
        }
        setSearchQuery('');
      } catch (err) {
        console.error('Error iniciando chat:', err);
      }
    }
  };

  // Manejo de archivo adjunto
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Enviar mensaje en el chat seleccionado
  const handleSendMessage = async () => {
    if (!selectedChatId || !newMessage.trim()) return;

    try {
      const formData = new FormData();
      formData.append('text', newMessage);
      if (file) {
        formData.append('file', file);
      }

      const msgCreated = await chatService.sendMessage(selectedChatId, formData);

      // Actualizar la lista de mensajes localmente
      setMessages([...messages, msgCreated]);

      // Limpiar campos
      setNewMessage('');
      setFile(null);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    // Aquí podrías limpiar tokens, etc.
    // Redirigir a la página inicial
    navigate('/');
  };

  return (
    <div className="messaging-container">
      {/* Cabecera en morado */}
      <header className="top-bar">
        <div className="left-section">
          <i className="fa fa-user-circle user-icon" aria-hidden="true"></i>
        </div>
        <div className="center-section">
          <h1 className="title">JANUS</h1>
        </div>
        <div className="right-section">
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="messaging-main">
        {/* Columna izquierda: Lista de chats + Búsqueda */}
        <div className="chat-list-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="To: Enviar a..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {chats.length === 0 ? (
            <div className="no-chats">
              <p>Comienza a conversar ahora con tus especialistas! <span>😊</span></p>
            </div>
          ) : (
            <ul className="chat-list">
              {chats.map((chat) => (
                <li
                  key={chat.id}
                  className={`chat-item ${chat.id === selectedChatId ? 'selected' : ''}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="chat-avatar">
                    <i className="fa fa-user-circle" aria-hidden="true"></i>
                  </div>
                  <div className="chat-info">
                    <p className="chat-name">{chat.otherUserName} ({chat.otherUserRole})</p>
                    {/* Podrías mostrar el último mensaje */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columna derecha: Detalle del chat */}
        <div className="chat-detail">
          {selectedChatId ? (
            <>
              {/* Mensajes */}
              <div className="messages-area">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message-item ${
                      msg.senderId === 'CURRENT_USER_ID' ? 'message-outgoing' : 'message-incoming'
                    }`}
                  >
                    <p className="message-sender">{msg.senderName}:</p>
                    <p className="message-text">{msg.text}</p>
                    {msg.fileUrl && (
                      <div className="message-file">
                        <a href={msg.fileUrl} download>
                          {msg.fileName || 'Descargar archivo'}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Nuevo mensaje */}
              <div className="new-message-area">
                <label htmlFor="fileInput" className="attach-btn">
                  <i className="fa fa-paperclip" aria-hidden="true"></i>
                </label>
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <input
                  type="text"
                  className="message-input"
                  placeholder="Escribe algo..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="send-btn" onClick={handleSendMessage}>Enviar</button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Selecciona un chat para ver los mensajes</p>
            </div>
          )}
        </div>
      </main>

      {/* Pie de página en morado */}
      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default Messaging;
