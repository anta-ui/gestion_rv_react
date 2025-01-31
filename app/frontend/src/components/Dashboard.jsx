import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User,LayoutDashboard, Calendar, LogOut  } from 'lucide-react';
import { logout } from '../features/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Récupérer le nom d'utilisateur du localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'Utilisateur' };
  const username = user.username;

  const [appointments, setAppointments] = useState([]);
  const [appointmentsStats, setAppointmentsStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    canceled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Vérification du token et redirection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token non trouvé');

        // Utilisation de l'API correcte
        const response = await fetch('http://localhost:8000/api/appointments/stats/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const data = await response.json();
        setAppointmentsStats(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPieChartData = () => {
    return [
      { name: 'Complétés', value: appointmentsStats.completed },
      { name: 'Programmés', value: appointmentsStats.scheduled },
      { name: 'Annulés', value: appointmentsStats.canceled }
    ];
  };

  // Données pour le graphique en barres
  const getBarChartData = () => {
    return [
      {
        name: 'Statuts',
        Complétés: appointmentsStats.completed,
        Programmés: appointmentsStats.scheduled,
        Annulés: appointmentsStats.canceled,
      }
    ];
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    navigate('/login', { replace: true });  // Redirection vers la page de login
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-amber-100 text-deepRed p-4 rounded-lg">
        <h2 className="text-3xl font-bold mb-6 text-deepRed">Smart-Agenda</h2>
        <div className="flex items-center mb-6">
          <User className="mr-3 h-8 w-8 text-deppRed" />
          <span className="font-semibold text-2xl text-deppRed">{username}</span>
        </div>
        <ul className="space-y-4 text-deppRed">
            <li 
              className={`flex items-center cursor-pointer p-2 rounded ${activeView === 'dashboard' ? 'text-deepRed' : 'hover:bg-amber-200'}`} 
              onClick={() => setActiveView('dashboard')}
            >
              <LayoutDashboard className="mr-3 h-8 w-8 text-deppRed" />
              Tableau de bord
            </li>

            <li 
              className={`flex items-center cursor-pointer p-2 rounded ${
                activeView === "appointments" ? "bg-amber-200" : "hover:bg-amber-200"
              }`}
              onClick={() => {
                setActiveView("appointments");
                navigate("/add-appointment"); // Redirection vers AddAppointment
              }}
            >
              <Calendar className="mr-3 h-8 w-8 text-deppRed" />
              Rendez-vous
            </li>

            <li 
              className="flex items-center cursor-pointer hover:bg-amber-200 p-2 rounded" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-8 w-8 text-deppRed" />
              Déconnexion
            </li>
          </ul>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-amber-50 overflow-auto">
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {activeView === 'dashboard' && (
          <>
            <h1 className="text-3xl font-bold mb-6 text-deepRed">Tableau de Bord</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className=" bg-amber-100 p-4 rounded-lg shadow border">
                <h3 className="text-lg font-bold mb-4 text-deepRed">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 p-3 rounded">
                    <p className="text-sm text-deepRed">Total</p>
                    <p className="text-2xl font-bold">{appointmentsStats.total}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-deepRed">Complétés</p>
                    <p className="text-2xl font-bold">{appointmentsStats.completed}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-deepRed">Programmés</p>
                    <p className="text-2xl font-bold">{appointmentsStats.scheduled}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-sm text-deepRed">Annulés</p>
                    <p className="text-2xl font-bold">{appointmentsStats.canceled}</p>
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className=" bg-amber-100 p-4 rounded-lg shadow border">
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
            <div className=" bg-amber-100 p-4 rounded-lg shadow border">
              <h3 className="text-lg font-bold mb-2 text-deepRed">Statistiques des rendez-vous</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Complétés" fill="#00C49F" />
                  <Bar dataKey="Programmés" fill="#0088FE" />
                  <Bar dataKey="Annulés" fill="#FF8042" />
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