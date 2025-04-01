// components/PlanetMap.js
import React, { useState } from 'react';
import Draggable from 'react-draggable'; // Para permitir arrastrar libremente
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/miPlaneta.css';

// Definición de elementos disponibles con imágenes externas
const availableElements = [
  { id: 'estadio', title: 'Estadio', image: 'https://images.vexels.com/media/users/3/140819/isolated/lists/4d0ae33b94fc8088280c24d681c2d638-manaos-stadium.png' },
  { id: 'parque', title: 'Parque', image: 'https://png.pngtree.com/png-clipart/20231021/original/pngtree-playground-park-side-png-image_13394708.png' },
  { id: 'colegio', title: 'Colegio', image: 'https://static.vecteezy.com/system/resources/thumbnails/044/764/439/small/school-icon-3d-render-concept-of-education-icon-illustration-png.png' },
  { id: 'biblioteca', title: 'Biblioteca', image: 'https://www.pngall.com/wp-content/uploads/15/Library-PNG-Photo.png' },
  { id: 'hospital', title: 'Hospital', image: 'https://static.vecteezy.com/system/resources/previews/009/350/681/non_2x/building-place-hospital-png.png' }
];

// Opciones de tamaño: 1 (pequeño), 2 (mediano) y 3 (grande)
const sizeScales = {
  1: 0.8,
  2: 1.0,
  3: 1.2
};

function MiPlaneta() {
  const [planetElements, setPlanetElements] = useState([]);
  const [zoom, setZoom] = useState(1);
  const navigate = useNavigate();

  // Inicia el drag desde el panel lateral
  const handleDragStart = (e, element) => {
    e.dataTransfer.setData("element", JSON.stringify(element));
  };

  // Añade el elemento soltado en el área del planeta, con posición y tamaño por defecto (Mediano)
  const handleDrop = (e) => {
    e.preventDefault();
    const element = JSON.parse(e.dataTransfer.getData("element"));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const newElement = {
      uid: Date.now(), // ID único
      ...element,
      x,
      y,
      size: 2 // tamaño mediano por defecto
    };
    setPlanetElements(prev => [...prev, newElement]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Actualiza la posición del elemento al finalizar el drag
  const updatePosition = (uid, x, y) => {
    setPlanetElements(prev => prev.map(el => el.uid === uid ? { ...el, x, y } : el));
  };

  // Modifica el tamaño según la acción: 'up' para aumentar, 'down' para disminuir
  const changeSize = (uid, action) => {
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

  // Controles de zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  // Guarda la configuración del planeta en el backend
  const handleSavePlanet = async () => {
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
        <h1>Mi Planeta – Crea tu hábitat</h1>
      </header>

      <div className="pm-instructions">
        <p>Este es TU PLANETA, llénalo con las cosas que más te gustan hacer</p>
        <p>
          Cada opción tiene tres tamaños diferentes. Elige el tamaño que mejor represente cuánto te gusta: 
          <strong> más grande si te encanta,</strong> 
          <strong> mediano si te gusta,</strong> 
          <strong> pequeño si te gusta menos.</strong>
        </p>
      </div>

      <div className="pm-controls">
        <button onClick={handleZoomOut}>− Zoom</button>
        <button onClick={handleZoomIn}>+ Zoom</button>
      </div>

      <div className="pm-content">
        {/* Panel lateral de elementos disponibles */}
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

        {/* Área del planeta: ahora usa una imagen (planet.png) */}
        <div 
          className="pm-planet-area" 
          onDrop={handleDrop} 
          onDragOver={handleDragOver}
          style={{ transform: `scale(${zoom})` }}
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
                  <img src={el.image} alt={el.title} style={{ width: '100%', height: '100%' }} />
                  <div className="pm-size-controls">
                    <button className="size-btn" onClick={() => changeSize(el.uid, 'up')}>
                      <i className="fa fa-arrow-up" aria-hidden="true"></i>
                    </button>
                    <button className="size-btn" onClick={() => changeSize(el.uid, 'down')}>
                      <i className="fa fa-arrow-down" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </Draggable>
            ))}
          </div>
        </div>
      </div>

      <div className="pm-actions">
        <button className="save-btn" onClick={handleSavePlanet}>Guardar Mi Planeta</button>
      </div>

      <footer className="pm-footer">
        <p>2025 © Tu Aplicación</p>
      </footer>
    </div>
  );
}


export default MiPlaneta;
