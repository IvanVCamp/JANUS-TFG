import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../services/chatService';
import '../styles/messaging.css';

function Messaging() {
  const navigate = useNavigate();

  // ID del usuario actual
  const [currentUserId, setCurrentUserId] = useState(null);

  // Lista de chats, chat seleccionado, mensajes
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Búsqueda de usuarios
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Texto del mensaje (comentario opcional) y archivo adjunto
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);

  // Vista previa del archivo
  const [filePreview, setFilePreview] = useState(null);

  // Decodificar el token para obtener el ID del usuario (simplificado)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1])); 
      setCurrentUserId(decoded.user?.id);
    }
  }, []);

  // Cargar la lista de chats
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

  // Cargar mensajes al seleccionar un chat
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

  // Búsqueda con debounce
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const previewURL = URL.createObjectURL(selectedFile);
      const sizeKB = (selectedFile.size / 1024).toFixed(1);
      setFilePreview({
        name: selectedFile.name,
        sizeKB,
        type: selectedFile.type,
        previewURL
      });
      setNewMessage('');
    }
  };

  const handleCancelPreview = () => {
    setFile(null);
    setFilePreview(null);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!selectedChatId) return;
    if (!file && !newMessage.trim()) return;

    try {
      const formData = new FormData();
      formData.append('text', newMessage);
      if (file) formData.append('file', file);
      const msgCreated = await chatService.sendMessage(selectedChatId, formData);
      setMessages(prev => [...prev, msgCreated]);
      setNewMessage('');
      setFile(null);
      setFilePreview(null);
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

  const handleLogout = () => {
    navigate('/');
  };

  // Botón para regresar al Dashboard
  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  const getOtherParticipant = (chat) => {
    if (!chat.participants || !currentUserId) return null;
    return chat.participants.find(p => p._id !== currentUserId);
  };

  const renderChatList = () => {
    if (chats.length === 0) {
      return (
        <div className="no-chats">
          <p>Comienza a conversar ahora con tus especialistas! 😊</p>
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

  const renderFilePreview = () => {
    if (!filePreview) return null;
    const isImage = filePreview.type.startsWith('image/');
    return (
      <div className="file-preview-container">
        {isImage ? (
          <img src={filePreview.previewURL} alt="Vista previa" className="file-preview-image" />
        ) : (
          <div className="file-preview-placeholder">
            <i className="fa fa-file-pdf-o" aria-hidden="true"></i>
          </div>
        )}
        <p className="file-preview-name">
          {filePreview.name} ({filePreview.sizeKB} KB)
        </p>
        <textarea
          className="file-preview-comment"
          placeholder="Comentario (opcional)"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <div className="file-preview-buttons">
          <button onClick={handleCancelPreview} className="btn-cancel">Cancelar</button>
          <button onClick={handleSendMessage} className="btn-send">Enviar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="messaging-container">
      <header className="top-bar">
        <div className="left-section">
          <button className="back-dashboard-btn" onClick={handleGoDashboard}>←</button>
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

        <div className="chat-detail">
          {selectedChatId ? (
            <>
              <div className="messages-area">
                {messages.map((msg, idx) => {
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
              {filePreview ? renderFilePreview() : (
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
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Selecciona un chat para ver los mensajes</p>
            </div>
          )}
        </div>
      </main>

      <footer className="footer-bar">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default Messaging;
