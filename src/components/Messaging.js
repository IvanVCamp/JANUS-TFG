// components/Messaging.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../services/chatService';
import '../styles/messaging.css';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de usar la versión adecuada

function Messaging() {
  const navigate = useNavigate();

  // Obtener el ID del usuario actual decodificando el token
  const [currentUserId, setCurrentUserId] = useState(null);

  // Estados para chats y mensajes
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Estados para la búsqueda de usuarios
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Estados para el nuevo mensaje y archivo adjunto
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);

  // Decodificar token al montar para obtener el ID del usuario actual
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.user?.id);
    }
  }, []);

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

  // Cargar mensajes cuando se selecciona un chat
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

  // Búsqueda con debounce de 300ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        chatService.searchUsers(searchQuery.trim())
          .then(results => setSearchResults(results))
          .catch(err => {
            console.error('Error buscando usuarios:', err);
            setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Manejo de cambios en el input de búsqueda
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Al seleccionar un usuario, iniciar o abrir el chat
  const handleSelectUser = async (user) => {
    try {
      const newChat = await chatService.startChat(user._id);
      setChats(prev => [...prev, newChat]);
      setSelectedChatId(newChat._id || newChat.id);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error iniciando chat:', err);
    }
  };

  // Manejo de archivo adjunto: guarda el archivo seleccionado
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Enviar mensaje en el chat seleccionado, incluyendo archivo si existe
  const handleSendMessage = async () => {
    if (!selectedChatId || !newMessage.trim()) return;

    try {
      const formData = new FormData();
      formData.append('text', newMessage);
      if (file) {
        formData.append('file', file);
      }
      const msgCreated = await chatService.sendMessage(selectedChatId, formData);
      setMessages(prev => [...prev, msgCreated]);
      setNewMessage('');
      setFile(null);

      // Opcional: actualizar "lastMessage" en la lista de chats
      setChats(prevChats =>
        prevChats.map(c =>
          (c._id === selectedChatId || c.id === selectedChatId)
            ? { ...c, lastMessage: msgCreated }
            : c
        )
      );
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    navigate('/');
  };

  // Función para obtener el "otro participante" (distinto al usuario actual)
  const getOtherParticipant = (chat) => {
    if (!chat.participants || !currentUserId) return null;
    return chat.participants.find(p => p._id !== currentUserId);
  };

  // Renderizar la lista de chats en el panel izquierdo
  const renderChatList = () => {
    if (chats.length === 0) {
      return (
        <div className="no-chats">
          <p>Comienza a conversar ahora con tus especialistas! <span>😊</span></p>
        </div>
      );
    }

    return (
      <ul className="chat-list">
        {chats.map((chat) => {
          const chatId = chat._id || chat.id;
          const otherUser = getOtherParticipant(chat);
          const isSelected = chatId === selectedChatId;
          return (
            <li
              key={chatId}
              className={`chat-item ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedChatId(chatId)}
            >
              <div className="chat-avatar">
                <i className="fa fa-user-circle" aria-hidden="true"></i>
              </div>
              <div className="chat-info">
                <p className="chat-name">
                  {otherUser ? `${otherUser.nombre} ${otherUser.apellidos}` : 'Usuario desconocido'}
                </p>
                {chat.lastMessage && (
                  <p className="chat-last-message">
                    {chat.lastMessage.text ? chat.lastMessage.text : '[Archivo adjunto]'}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="messaging-container">
      {/* Barra superior */}
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

      {/* Área principal */}
      <main className="messaging-main">
        {/* Columna izquierda: búsqueda y lista de chats */}
        <div className="chat-list-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchResults.length > 0 && (
              <ul className="search-dropdown">
                {searchResults.map((user) => (
                  <li
                    key={user._id}
                    className="search-dropdown-item"
                    onClick={() => handleSelectUser(user)}
                  >
                    {user.nombre} {user.apellidos} ({user.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
          {renderChatList()}
        </div>

        {/* Columna derecha: detalle del chat */}
        <div className="chat-detail">
          {selectedChatId ? (
            <>
              <div className="messages-area">
                {messages.map((msg, idx) => {
                  // Si el backend no popula el sender, usa: msg.sender === currentUserId
                  // Si se popula, usa msg.sender._id === currentUserId
                  const isOutgoing = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                  return (
                    <div
                      key={idx}
                      className={`message-item ${isOutgoing ? 'message-outgoing' : 'message-incoming'}`}
                    >
                      <p className="message-text">{msg.text}</p>
                      {msg.fileUrl && (
                        <div className="message-file">
                          <a href={msg.fileUrl} download>
                            {msg.fileName || 'Descargar archivo'}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                <button className="send-btn" onClick={handleSendMessage}>
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Selecciona un chat para ver los mensajes</p>
            </div>
          )}
        </div>
      </main>

      {/* Pie de página */}
      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default Messaging;
