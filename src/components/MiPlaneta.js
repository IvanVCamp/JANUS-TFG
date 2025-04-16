import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/miPlaneta.css';

// Lista de elementos disponibles (con imágenes externas)
const availableElements = [
  { id: 'estadio', title: 'Estadio', image: 'https://images.vexels.com/media/users/3/140819/isolated/lists/4d0ae33b94fc8088280c24d681c2d638-manaos-stadium.png' },
  { id: 'parque', title: 'Parque', image: 'https://png.pngtree.com/png-clipart/20231021/original/pngtree-playground-park-side-png-image_13394708.png' },
  { id: 'colegio', title: 'Colegio', image: 'https://static.vecteezy.com/system/resources/thumbnails/044/764/439/small/school-icon-3d-render-concept-of-education-icon-illustration-png.png' },
  { id: 'biblioteca', title: 'Biblioteca', image: 'https://www.pngall.com/wp-content/uploads/15/Library-PNG-Photo.png' },
  { id: 'hospital', title: 'Hospital', image: 'https://static.vecteezy.com/system/resources/previews/009/350/681/non_2x/building-place-hospital-png.png' }
];

// Escala de tamaños: 1 (pequeño), 2 (mediano) y 3 (grande)
const sizeScales = {
  1: 0.8,
  2: 1.0,
  3: 1.2
};

function MiPlaneta() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detectamos si hay un parámetro "patientId" en la URL (modo vista o snapshot)
  const searchParams = new URLSearchParams(location.search);
  const queryPatientId = searchParams.get('patientId');
  const isViewMode = Boolean(queryPatientId);

  const [planetElements, setPlanetElements] = useState([]);
  const [planetName, setPlanetName] = useState("Mi Planeta");
  const [planetSlogan, setPlanetSlogan] = useState("");

  // Verifica que haya token; si no, redirige
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);

  // Si estamos en "modo vista" (para el terapeuta), obtenemos la snapshot
  useEffect(() => {
    if (isViewMode) {
      const fetchSnapshot = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/api/planet-map?patientId=${queryPatientId}`, {
            headers: { 'x-auth-token': token }
          });
          if (response.data && response.data.elements) {
            // Convertimos cada elemento: usamos "elementId" como "id" para nuestra UI
            const savedElements = response.data.elements.map(el => ({
              id: el.elementId,
              title: el.title,
              image: el.image,
              size: el.size,
              x: el.x,
              y: el.y
            }));
            setPlanetElements(savedElements);
          }
        } catch (err) {
          console.error("Error al obtener la snapshot:", err);
        }
      };
      fetchSnapshot();
    }
  }, [isViewMode, queryPatientId]);

  // ———————————————————————
  // Funciones de edición (solo en modo normal, NO en modo vista)
  // ———————————————————————
  const handleDragStart = (e, element) => {
    if (isViewMode) return; // no se permite en modo vista
    e.dataTransfer.setData("text/plain", JSON.stringify(element));
  };

  const handleDrop = (e) => {
    if (isViewMode) return;
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) {
      console.warn("No se encontró dato de 'element' en dataTransfer.");
      return;
    }
    let element;
    try {
      element = JSON.parse(data);
    } catch (err) {
      console.error("Error al parsear JSON:", err);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newElement = {
      uid: Date.now(), // ID único para el elemento
      ...element,
      x,
      y,
      size: 2 // tamaño mediano por defecto
    };
    setPlanetElements(prev => [...prev, newElement]);
  };

  const handleDragOver = (e) => {
    if (isViewMode) return;
    e.preventDefault();
  };

  const updatePosition = (uid, x, y) => {
    if (isViewMode) return;
    setPlanetElements(prev =>
      prev.map(el => (el.uid === uid ? { ...el, x, y } : el))
    );
  };

  const changeSize = (uid, action) => {
    if (isViewMode) return;
    setPlanetElements(prev =>
      prev.map(el => {
        if (el.uid === uid) {
          let newSize = el.size;
          if (action === 'up' && el.size < 3) newSize = el.size + 1;
          if (action === 'down' && el.size > 1) newSize = el.size - 1;
          return { ...el, size: newSize };
        }
        return el;
      })
    );
  };

  const handleDeleteElement = (uid) => {
    if (isViewMode) return;
    setPlanetElements(prev => prev.filter(el => el.uid !== uid));
  };

  const handleUndo = () => {
    if (isViewMode) return;
    setPlanetElements(prev => prev.slice(0, -1));
  };

  const handleDuplicateLast = () => {
    if (isViewMode) return;
    setPlanetElements(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const duplicate = { ...last, uid: Date.now(), x: last.x + 10, y: last.y + 10 };
      return [...prev, duplicate];
    });
  };

  const handleReset = () => {
    if (isViewMode) return;
    setPlanetElements([]);
  };

  // Guarda la configuración actual (la "snapshot") y vuelve al dashboard
  const handleSavePlanet = async () => {
    if (isViewMode) return;
    try {
      const token = localStorage.getItem('token');
      const payload = { elements: planetElements };
      await axios.post('http://localhost:5000/api/planet-map', payload, {
        headers: { 'x-auth-token': token }
      });
      alert('Planeta guardado exitosamente.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el planeta.');
    }
  };

  return (
    <div className="planet-map-container">
      <header className="pm-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <h1>
          {planetName} {isViewMode && "- Snapshot"} 
          – {isViewMode ? "Vista del último guardado" : "Crea tu hábitat"}
        </h1>
      </header>

      {/* Modo edición (Paciente): mostramos instrucciones + layout con panel lateral y config */}
      {!isViewMode && (
        <>
          <div className="pm-instructions">
            <p>Este es TU PLANETA, llénalo con las cosas que más te gustan hacer</p>
            <p>
              Cada opción tiene tres tamaños diferentes. Elige el tamaño que mejor represente cuánto te gusta:&nbsp;
              <strong>más grande si te encanta, </strong>
              <strong>mediano si te gusta, </strong>
              <strong>pequeño si te gusta menos.</strong>
            </p>
          </div>

          {/* Contenedor principal: panel lateral + área de planeta (columna izquierda)
              y panel de configuración (columna derecha) */}
          <div className="pm-main-content">
            {/* COLUMNA IZQUIERDA */}
            <div className="pm-left-section">
              {/* Panel lateral de Elementos Disponibles */}
              <aside className="pm-sidebar">
                <h2>Elementos Disponibles</h2>
                <div className="pm-sidebar-list">
                  {availableElements.map((el) => (
                    <div
                      key={el.id}
                      className="pm-sidebar-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, el)}
                    >
                      <img src={el.image} alt={el.title} className="pm-element-image" />
                      <span>{el.title}</span>
                    </div>
                  ))}
                </div>
              </aside>

              {/* Área del planeta (drop zone) */}
              <div
                className="pm-planet-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="pm-planet">
                  {planetElements.map((el) => (
                    <Draggable
                      key={el.uid}
                      defaultPosition={{ x: el.x, y: el.y }}
                      onStop={(e, data) => updatePosition(el.uid, data.x, data.y)}
                    >
                      <div
                        className="pm-planet-element"
                        style={{
                          width: `${sizeScales[el.size] * 80}px`,
                          height: `${sizeScales[el.size] * 80}px`
                        }}
                      >
                        <img 
                          src={el.image} 
                          alt={el.title} 
                          style={{ width: '100%', height: '100%' }} 
                        />
                        <div className="pm-size-controls">
                          <button className="size-btn" onClick={() => changeSize(el.uid, 'up')}>
                            <i className="fa fa-arrow-up" aria-hidden="true"></i>
                          </button>
                          <button className="size-btn" onClick={() => changeSize(el.uid, 'down')}>
                            <i className="fa fa-arrow-down" aria-hidden="true"></i>
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteElement(el.uid)}>
                            <i className="fa fa-trash" aria-hidden="true"></i>
                          </button>
                        </div>
                      </div>
                    </Draggable>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Panel de Configuración */}
            <div className="pm-config-panel">
              <h2>Configuración</h2>
              <div className="pm-config-item">
                <label>Nombre del Planeta:</label>
                <input
                  type="text"
                  value={planetName}
                  onChange={(e) => setPlanetName(e.target.value)}
                />
              </div>
              <div className="pm-config-item">
                <label>Eslogan del Planeta:</label>
                <input
                  type="text"
                  placeholder="Tu eslogan aquí..."
                  value={planetSlogan}
                  onChange={(e) => setPlanetSlogan(e.target.value)}
                />
              </div>
              <div className="pm-config-item">
                <p>Total de Hábitats: {planetElements.length}</p>
              </div>
              <div className="pm-config-buttons">
                <button onClick={handleReset}>Limpiar Planeta</button>
                <button onClick={handleUndo}>Deshacer Última Acción</button>
                <button onClick={handleDuplicateLast}>Duplicar Último Hábitat</button>
              </div>
              <div className="pm-config-buttons">
                <button onClick={handleSavePlanet}>Guardar Planeta</button>
              </div>
              {planetSlogan && (
                <div className="pm-slogan-preview">
                  <p><em>{planetSlogan}</em></p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modo vista (Terapeuta): solo mostramos el área del planeta con los elementos inmóviles */}
      {isViewMode && (
        <div className="pm-planet-area">
          <div className="pm-planet">
            {planetElements.map((el) => (
              <div
                key={el.id}
                className="pm-planet-element"
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: `${sizeScales[el.size] * 80}px`,
                  height: `${sizeScales[el.size] * 80}px`
                }}
              >
                <img 
                  src={el.image} 
                  alt={el.title} 
                  style={{ width: '100%', height: '100%' }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="pm-footer">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default MiPlaneta;
