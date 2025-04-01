import React, { useState, useEffect } from 'react';
// Usamos el fork de react-beautiful-dnd
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/miPlaneta.css';

const paletteElements = [
  { id: 'estadio', name: 'Estadio', type: 'Estadio', defaultSize: 'medium', color: '#FF7043' },
  { id: 'parque', name: 'Parque', type: 'Parque', defaultSize: 'medium', color: '#66BB6A' },
  { id: 'colegio', name: 'Colegio', type: 'Colegio', defaultSize: 'medium', color: '#42A5F5' },
  { id: 'biblioteca', name: 'Biblioteca', type: 'Biblioteca', defaultSize: 'medium', color: '#AB47BC' },
  { id: 'museo', name: 'Museo', type: 'Museo', defaultSize: 'medium', color: '#FFCA28' },
  { id: 'centro_comercial', name: 'Centro Comercial', type: 'Centro Comercial', defaultSize: 'medium', color: '#8D6E63' },
  { id: 'cine', name: 'Cine', type: 'Cine', defaultSize: 'medium', color: '#26A69A' }
];

const generatePlanetZones = () => {
  // Generamos un solo "mapa" para el planeta. Aquí lo consideramos como un único droppable.
  return { id: 'planet', items: [] };
};

function MiPlaneta() {
  const navigate = useNavigate();
  const [planetZone, setPlanetZone] = useState(generatePlanetZones());
  const [zoom, setZoom] = useState(1);
  
  // Verifica token; si no existe, redirige al login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);
  
  // Maneja el zoom del planeta
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  // Función para manejar el drag and drop
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    
    // Si el item proviene del panel (palette) y se suelta en el planeta
    if (source.droppableId === 'palette' && destination.droppableId === 'planet') {
      const original = paletteElements.find(el => el.id === draggableId);
      if (!original) return;
      // Creamos una nueva instancia con un id único y posición basada en el index (para simplicidad)
      const newItem = {
        instanceId: `${original.id}-${Date.now()}`,
        type: original.type,
        name: original.name,
        size: original.defaultSize, // tamaño inicial: mediano
        color: original.color,
        // Guardamos la posición en la "lista" como índice
        positionIndex: destination.index
      };
      const newZone = { ...planetZone };
      newZone.items.splice(destination.index, 0, newItem);
      setPlanetZone(newZone);
      return;
    }
    
    // Movimiento dentro del planeta
    if (source.droppableId === 'planet' && destination.droppableId === 'planet') {
      const newZone = { ...planetZone };
      const [movedItem] = newZone.items.splice(source.index, 1);
      newZone.items.splice(destination.index, 0, movedItem);
      setPlanetZone(newZone);
    }
  };

  // Cambiar el tamaño de un elemento: tres botones o selector (small, medium, large)
  const handleChangeSize = (instanceId, newSize) => {
    setPlanetZone(prev => {
      const newItems = prev.items.map(item =>
        item.instanceId === instanceId ? { ...item, size: newSize } : item
      );
      return { ...prev, items: newItems };
    });
  };

  // Guardar la configuración del planeta
  const handleSavePlanet = async () => {
    const token = localStorage.getItem('token');
    // Transformamos la data para enviar solo los campos necesarios:
    const payload = {
      habitats: planetZone.items.map(item => ({
        elementType: item.type,
        size: item.size,
        // Para este ejemplo, usamos el índice como posición (podrías mejorar con coordenadas reales)
        position: { x: item.positionIndex, y: 0 }
      }))
    };
    try {
      await axios.post('http://localhost:5000/api/planet', payload, {
        headers: { 'x-auth-token': token }
      });
      alert('¡Tu planeta ha sido guardado!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el planeta.');
    }
  };

  return (
    <div className="mi-planeta-container">
      <header className="mp-header">
        <div className="mp-header-left">
          <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>←</button>
          <h1>Mi Planeta</h1>
        </div>
        <div className="mp-zoom-controls">
          <button onClick={handleZoomOut}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn}>+</button>
        </div>
      </header>

      <div className="mp-instructions">
        <p>
          Este es <strong>TU PLANETA</strong>, llénalo con las cosas que más te gustan hacer.
          <br />
          Cada opción tiene tres tamaños diferentes. Elige el tamaño que mejor represente cuánto te gusta: 
          más grande si te encanta, mediano si te gusta, y pequeño si te gusta menos.
        </p>
      </div>

      <div className="mp-content">
        {/* Panel de elementos (palette) */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="mp-palette">
            <h2>Elementos Disponibles</h2>
            <Droppable droppableId="palette" isDropDisabled>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {paletteElements.map((el, index) => (
                    <Draggable key={el.id} draggableId={el.id} index={index}>
                      {(providedDraggable) => (
                        <div
                          className="mp-palette-item"
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          style={{ backgroundColor: el.color }}
                        >
                          {el.name}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Indicaciones sobre tamaños */}
            <div className="mp-size-info">
              <p><strong>Tamaños:</strong> Grande, Mediano, Pequeño</p>
            </div>
          </div>

          {/* Mapa del planeta */}
          <div className="mp-planet" style={{ transform: `scale(${zoom})` }}>
            <h2>Tu Planeta</h2>
            <Droppable droppableId="planet">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="planet-droppable">
                  {planetZone.items.map((item, index) => (
                    <Draggable key={item.instanceId} draggableId={item.instanceId} index={index}>
                      {(providedDraggable) => (
                        <div
                          className={`mp-planet-item size-${item.size}`}
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          style={{ backgroundColor: item.color }}
                        >
                          <span className="mp-item-name">{item.name}</span>
                          {/* Controles para cambiar tamaño */}
                          <div className="mp-size-controls">
                            <button onClick={() => handleChangeSize(item.instanceId, 'large')}>G</button>
                            <button onClick={() => handleChangeSize(item.instanceId, 'medium')}>M</button>
                            <button onClick={() => handleChangeSize(item.instanceId, 'small')}>P</button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>

      <div className="mp-actions">
        <button className="mp-save-btn" onClick={handleSavePlanet}>Guardar mi Planeta</button>
      </div>

      <footer className="mp-footer">
        <p>2025 © Iván Vela Campos</p>
      </footer>
    </div>
  );
}

export default MiPlaneta;
