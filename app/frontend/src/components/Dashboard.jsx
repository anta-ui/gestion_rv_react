import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User, LayoutDashboard, Calendar, LogOut, Plus } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';// Assurez-vous que le chemin est correct

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'Utilisateur' };
  const username = user.username;

  const {
    appointmentsStats,
    loading,
    error,
    fetchStats
  } = useAppointments();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#EF4444'];

  useEffect(() => {
    fetchStats();
    
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
}, [fetchStats]);

const handleLogout = () => {
  localStorage.removeItem("token");  // Supprimer le token d'abord
  setTimeout(() => {
      navigate("/login", { replace: true }); // Redirection sécurisée
  }, 0); // Petite pause pour éviter les conflits
};

  const getPieChartData = () => [
    { name: 'Passés', value: appointmentsStats.completed },
    { name: 'Programmés', value: appointmentsStats.scheduled },
    { name: 'Annulés', value: appointmentsStats.canceled },
  ];

  const getBarChartData = () => [
    {
      name: 'Statuts',
      Passés: appointmentsStats.completed,
      Programmés: appointmentsStats.scheduled,
      Annulés: appointmentsStats.canceled,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-amber-100 text-deepRed p-4 rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-deepRed">Smart-Agenda</h2>
        <div className="flex items-center mb-6">
          <User className="mr-3 h-8 w-8 text-deepRed" />
          <span className="font-semibold text-2xl text-deepRed">{username.toUpperCase()}</span>
        </div>
        <ul className="space-y-4 text-deepRed">
          <li 
            className={`flex items-center cursor-pointer p-2 rounded ${activeView === 'dashboard' ? 'bg-amber-200' : 'hover:bg-amber-200'}`} 
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard className="mr-3 h-8 w-8 text-deepRed" />
            Tableau de bord
          </li>
          <li 
            className={`flex items-center cursor-pointer p-2 rounded ${activeView === 'appointments' ? 'bg-amber-200' : 'hover:bg-amber-200'}`} 
            onClick={() => {
              setActiveView('appointments');
              navigate('/add-appointment');
            }}
          >
            <Plus className="mr-3 h-8 w-8 text-deepRed" />
            Ajout Rendez-vous
          </li>
          <li 
            className={`flex items-center cursor-pointer p-2 rounded ${activeView === 'appointments' ? 'bg-amber-200' : 'hover:bg-amber-200'}`} 
            onClick={() => {
              setActiveView('appointments');
              navigate('/appointment-list');
            }}
          >
            <Calendar className="mr-3 h-8 w-8 text-deepRed" />
            Liste Rendez-vous
          </li>
          <li 
            className="flex items-center cursor-pointer hover:bg-amber-200 p-2 rounded" 
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-8 w-8 text-deepRed" />
            Déconnexion
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-amber-50 overflow-auto">
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {activeView === 'dashboard' && (
          <>
            <h1 className="text-3xl font-bold mb-6 text-deepRed text-center">Tableau de Bord</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-amber-100 p-4 rounded-lg shadow border">
                <h3 className="text-lg font-bold mb-4 text-deepRed">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-300 p-3 rounded">
                    <p className="text-sm text-deepRed">Total</p>
                    <p className="text-2xl font-bold">{appointmentsStats.total}</p>
                  </div>
                  <div className="bg-blue-300 p-3 rounded">
                    <p className="text-sm text-deepRed">Passés</p>
                    <p className="text-2xl font-bold">{appointmentsStats.completed}</p>
                  </div>
                  <div className="bg-green-300 p-3 rounded">
                    <p className="text-sm text-deepRed">Programmés</p>
                    <p className="text-2xl font-bold">{appointmentsStats.scheduled}</p>
                  </div>
                  <div className="bg-red-500 p-3 rounded">
                    <p className="text-sm text-deepRed">Annulés</p>
                    <p className="text-2xl font-bold">{appointmentsStats.canceled}</p>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-amber-100 p-4 rounded-lg shadow border">
                <h3 className="text-lg font-bold mb-2 text-deepRed">Répartition des statuts</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      dataKey="value"
                      nameKey="name"
                      label
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-amber-100 p-4 rounded-lg shadow border">
              <h3 className="text-lg font-bold mb-2 text-deepRed">Statistiques des rendez-vous</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Complétés" fill="#0088FE" />
                  <Bar dataKey="Programmés" fill="#00C49F" />
                  <Bar dataKey="Annulés" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;