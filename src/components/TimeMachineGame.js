import React, { useState } from 'react';
// Cambiamos el import:
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import '../styles/timeMachineGame.css';

const initialActivities = [
  { id: 'futbol', title: 'Jugar al fútbol', icon: '⚽', defaultDuration: 60 },
  { id: 'dibujos', title: 'Ver dibujos animados', icon: '📺', defaultDuration: 60 },
  { id: 'comics', title: 'Leer cómics', icon: '📚', defaultDuration: 60 },
  { id: 'tarea', title: 'Hacer tarea', icon: '📝', defaultDuration: 60 },
  { id: 'videojuegos', title: 'Jugar videojuegos', icon: '🎮', defaultDuration: 60 },
  { id: 'helado', title: 'Comer helado', icon: '🍦', defaultDuration: 60 },
  { id: 'parque', title: 'Ir al parque', icon: '🏞️', defaultDuration: 60 },
  { id: 'banio', title: 'Bañarse', icon: '🛁', defaultDuration: 60 },
  { id: 'dormir', title: 'Dormir', icon: '😴', defaultDuration: 60 },
  { id: 'musica', title: 'Escuchar música', icon: '🎵', defaultDuration: 60 },
  { id: 'bailar', title: 'Bailar', icon: '💃', defaultDuration: 60 },
  { id: 'amigos', title: 'Jugar con amigos', icon: '👫', defaultDuration: 60 },
  { id: 'bicicleta', title: 'Montar en bicicleta', icon: '🚲', defaultDuration: 60 },
  { id: 'dibujar', title: 'Dibujar', icon: '🎨', defaultDuration: 60 },
  { id: 'mascotas', title: 'Jugar con mascotas', icon: '🐶', defaultDuration: 60 },
  { id: 'experimentos', title: 'Hacer experimentos', icon: '🔬', defaultDuration: 60 },
  { id: 'cantar', title: 'Cantar', icon: '🎤', defaultDuration: 60 },
  { id: 'lego', title: 'Construir con LEGO', icon: '🧱', defaultDuration: 60 },
  { id: 'nadar', title: 'Nadar', icon: '🏊', defaultDuration: 60 },
  { id: 'computadora', title: 'Jugar en la computadora', icon: '💻', defaultDuration: 60 }
];

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const label = `${String(i).padStart(2, '0')}:00`;
    slots.push({ id: label, activities: [] });
  }
  return slots;
};

function TimeMachineGame() {
  const [selectedDay, setSelectedDay] = useState('Miércoles');
  const [poolActivities] = useState(initialActivities);
  const [timeSlots, setTimeSlots] = useState(generateTimeSlots());

  const handleDayChange = (e) => setSelectedDay(e.target.value);

  const onDragEnd = (result) => {
    const { source, destination, draggableId, combine } = result;
    if (!destination && !combine) return;

    // Ejemplo: si no quieres permitir "soltar en el pool":
    // if (destination && destination.droppableId === 'pool') return;

    // Si viene del pool, se crea una "copia" en el slot
    if (source.droppableId === 'pool') {
      const originalId = draggableId.replace('pool-', '');
      const activity = poolActivities.find(act => act.id === originalId);
      if (!activity) return;
      const instance = {
        ...activity,
        instanceId: `${activity.id}-${Date.now()}`,
        duration: activity.defaultDuration
      };
      const slotIndex = timeSlots.findIndex(slot => slot.id === destination.droppableId);
      if (slotIndex === -1) return;
      const newSlots = [...timeSlots];
      newSlots[slotIndex].activities.splice(destination.index, 0, instance);
      setTimeSlots(newSlots);
      return;
    }

    // Para elementos ya en el board:
    if (combine) {
      // Combinar tarjetas
      const newSlots = [...timeSlots];
      const targetInstanceId = combine.draggableId;
      const targetSlotIndex = newSlots.findIndex(slot =>
        slot.activities.some(act => act.instanceId === targetInstanceId)
      );
      if (targetSlotIndex === -1) return;
      const targetIndex = newSlots[targetSlotIndex].activities.findIndex(
        act => act.instanceId === targetInstanceId
      );
      const sourceSlotIndex = newSlots.findIndex(slot => slot.id === source.droppableId);
      if (sourceSlotIndex === -1) return;
      const [movedItem] = newSlots[sourceSlotIndex].activities.splice(source.index, 1);
      newSlots[targetSlotIndex].activities.splice(targetIndex + 1, 0, movedItem);
      setTimeSlots(newSlots);
      return;
    } else {
      // Movimiento normal entre slots
      const newSlots = [...timeSlots];
      const sourceSlotIndex = newSlots.findIndex(slot => slot.id === source.droppableId);
      const destinationSlotIndex = newSlots.findIndex(slot => slot.id === destination.droppableId);
      if (sourceSlotIndex === -1 || destinationSlotIndex === -1) return;
      const [movedItem] = newSlots[sourceSlotIndex].activities.splice(source.index, 1);
      newSlots[destinationSlotIndex].activities.splice(destination.index, 0, movedItem);
      setTimeSlots(newSlots);
      return;
    }
  };

  const handleDurationChange = (slotId, instanceId, newDuration) => {
    setTimeSlots(prev =>
      prev.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              activities: slot.activities.map(act =>
                act.instanceId === instanceId ? { ...act, duration: newDuration } : act
              )
            }
          : slot
      )
    );
  };

  const handleSaveResult = async () => {
    const payload = {
      day: selectedDay,
      timeSlots: timeSlots.filter(slot => slot.activities.length > 0)
    };
    try {
      await axios.post('/api/game', payload, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      alert('¡Tu día ha sido guardado!');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el resultado.');
    }
  };

  return (
    <div className="time-machine-game-container">
      <header className="tmg-header">
        <h1>La Máquina del Tiempo</h1>
        <div className="tmg-day-selector">
          <label htmlFor="day-select">Elige un día:</label>
          <select id="day-select" value={selectedDay} onChange={handleDayChange}>
            <option value="Miércoles">Miércoles</option>
            <option value="Sábado">Sábado</option>
          </select>
        </div>
      </header>

      <div className="tmg-instructions">
        <p>
          ¡Esta es tu máquina del tiempo! Arrastra las actividades que normalmente haces un {selectedDay}.
          Ajusta el tiempo deslizando la barra para cada actividad.
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="tmg-content">
          {/* Pool de actividades */}
          <div className="tmg-pool">
            <h2>Actividades Divertidas</h2>
            <Droppable
              droppableId="pool"
              isCombineEnabled={false}
              renderClone={(provided, snapshot, rubric) => {
                const activity = poolActivities[rubric.source.index];
                return (
                  <div
                    className="tmg-activity-card"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <span className="tmg-activity-icon">{activity.icon}</span>
                    <span className="tmg-activity-title">{activity.title}</span>
                  </div>
                );
              }}
            >
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {poolActivities.map((activity, index) => (
                    <Draggable
                      key={`pool-${activity.id}`}
                      draggableId={`pool-${activity.id}`}
                      index={index}
                    >
                      {(providedDraggable) => (
                        <div
                          className="tmg-activity-card"
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                        >
                          <span className="tmg-activity-icon">{activity.icon}</span>
                          <span className="tmg-activity-title">{activity.title}</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Board para organizar el día */}
          <div className="tmg-board">
            <h2>Organiza tu día</h2>
            <div className="tmg-slots">
              {timeSlots.map(slot => (
                <div key={slot.id} className="tmg-slot">
                  <div className="tmg-slot-header">{slot.id}</div>
                  <Droppable droppableId={slot.id} isCombineEnabled={true}>
                    {(provided) => (
                      <div
                        className="tmg-slot-body"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {slot.activities.map((act, index) => (
                          <Draggable
                            key={act.instanceId}
                            draggableId={act.instanceId}
                            index={index}
                          >
                            {(providedDraggable) => (
                              <div
                                className="tmg-slot-activity"
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                {...providedDraggable.dragHandleProps}
                              >
                                <div className="tmg-slot-activity-header">
                                  <span className="tmg-activity-icon">{act.icon}</span>
                                  <span className="tmg-activity-title">{act.title}</span>
                                </div>
                                <div className="tmg-duration-control">
                                  <input
                                    type="range"
                                    min="30"
                                    max="120"
                                    step="15"
                                    value={act.duration}
                                    onChange={(e) =>
                                      handleDurationChange(
                                        slot.id,
                                        act.instanceId,
                                        parseInt(e.target.value, 10)
                                      )
                                    }
                                  />
                                  <span>{act.duration} min</span>
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
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>

      <div className="tmg-actions">
        <button className="tmg-save-btn" onClick={handleSaveResult}>
          Guardar mi día
        </button>
      </div>
    </div>
  );
}

export default TimeMachineGame;
