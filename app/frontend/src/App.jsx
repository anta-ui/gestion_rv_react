import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddAppointment from './components/AddAppointment';
import AppointmentList from './components/AppointmentList';

import EditAppointment from './components/EditAppointment';
import './index.css';

const HomePage = () => {
  return (
    <div
      className="h-screen w-full flex flex-col items-end justify-center text-white text-3xl bg-cover bg-center bg-no-repeat px-10"
      style={{ backgroundImage: `url('/images/back6.jpg')` }}
    >
      <div className="text-right mb-4 flex flex-col items-end">
        <h1 className="text-6xl font-bold text-[#210202]">Bienvenue à</h1>
        <h1 className="text-6xl font-bold text-[#210202]">Smart-Agenda</h1>
      </div>
      <div className="flex space-x-4">
        <Link to="/register" className="px-5 py-3 text-lg text-white bg-[#210202] rounded-md transition duration-300 hover:bg-[#582900]">
          S'inscrire
        </Link>
        <Link to="/login" className="px-5 py-3 text-lg text-white bg-[#210202] rounded-md transition duration-300 hover:bg-[#582900]">
          Se connecter
        </Link>
      </div>
    </div>
  );
};

const App = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />

          {/* Routes protégées */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-appointment" element={<AddAppointment />} />
            <Route path="appointment-list" element={<AppointmentList />} />
            <Route path="/appointments" element={<AppointmentList />} />
            
            <Route path="/appointments/edit/:appointmentId" element={<EditAppointment />} />
          </Route>

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
