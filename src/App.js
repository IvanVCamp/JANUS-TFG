import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Messaging from './components/Messaging';
import TaskPlanner from './components/TaskPlanner';
import TimeMachineGame from './components/TimeMachineGame';
import EmotionsDiary from './components/EmotionsDiary';
import MiPlaneta from './components/MiPlaneta';
import TherapistDashboard from './components/TherapistDashboard';
import PatientsList from './components/PatientsList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/messaging" element={<Messaging />} /> 
        <Route path="/planner" element={<TaskPlanner />} />
        <Route path="/time-machine-game" element={<TimeMachineGame />} />
        <Route path="/diario-de-emociones" element={<EmotionsDiary />} />
        <Route path="/mi-planeta" element={<MiPlaneta />} />
        <Route path="/therapist" element={<TherapistDashboard />} />
        <Route path="/therapist/patients" element={<PatientsList />} />
        </Routes>
    </Router>
  );
}

export default App;
