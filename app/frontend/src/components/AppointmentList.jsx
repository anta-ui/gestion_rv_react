import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { User, LayoutDashboard, Plus, Calendar, LogOut, Trash2, Edit } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useAppointments } from '../hooks/useAppointments';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const AppointmentList = () => {
    const { handleCancel, fetchStats } = useAppointments();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [appointments, setAppointments] = useState({
        current: [],
        past: [],
        cancelled: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUsername(decoded.username || '');
            if (decoded.exp < Date.now() / 1000) {
                handleLogout();
                return;
            }
        } catch (error) {
            console.error('Erreur de décodage du token:', error);
            handleLogout();
            return;
        }

        fetchAppointmentsAndStats();
        const interval = setInterval(fetchAppointmentsAndStats, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

   
    const fetchAppointmentsAndStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/appointments/');
            
            if (response.data) {
                const now = new Date();
                const processedAppointments = response.data.map(appt => ({
                    id: appt.id,
                    date: new Date(appt.date).toISOString(),
                    description: appt.description || 'Aucune description',  // Correction ici
                    status: appt.status,
                    user: appt.user
                }));
    
                setAppointments({
                    current: processedAppointments.filter(appt => new Date(appt.date) >= now && appt.status === 'active'),
                    past: processedAppointments.filter(appt => new Date(appt.date) < now && appt.status === 'active'),
                    cancelled: processedAppointments.filter(appt => appt.status === 'cancelled')
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            setError("Erreur lors de la récupération des rendez-vous.");
            if (error.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleModify = (appointmentId) => {
        navigate(`/appointments/edit/${appointmentId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login", { replace: true }), 0);
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
            try {
                await handleCancel(appointmentId);
                setAppointments(prevState => {
                    const appointmentToMove = prevState.current.find(appt => appt.id === appointmentId);
                    if (appointmentToMove) {
                        const cancelledAppointment = { ...appointmentToMove, status: 'cancelled' };
                        return {
                            current: prevState.current.filter(appt => appt.id !== appointmentId),
                            past: prevState.past,
                            cancelled: [...prevState.cancelled, cancelledAppointment]
                        };
                    }
                    return prevState;
                });
                await fetchStats();
            } catch (error) {
                console.error("Erreur lors de l'annulation:", error);
                alert("Erreur lors de l'annulation du rendez-vous. Veuillez réessayer.");
            }
        }
    };

    const renderTable = (title, data, actions = false) => (
        <div className="mb-6">
            <h2 className="text-xl font-semibold text-deepRed mb-4">{title}</h2>
            <table className="w-full border">
                <thead>
                    <tr className="bg-amber-100">
                        <th className="p-2 text-deepRed text-center">Date</th>
                        <th className="p-2 text-deepRed text-center">Heure</th>
                        <th className="p-2 text-deepRed">Description</th>
                        <th className="p-2 text-deepRed text-center">Statut</th>
                        {actions && <th className="p-2 text-deepRed text-center">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    
                    {data.length > 0 ? (
                        data.map(appt => (
                            <tr key={appt.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 text-center">{format(new Date(appt.date), 'dd/MM/yyyy')}</td>
                                <td className="p-2 text-center">{format(new Date(appt.date), 'HH:mm')}</td>
                                <td className="p-2">{appt.description}</td>
                                <td className="p-2 text-center">
                                    {appt.status === 'cancelled' ? 
                                        <span className="text-red-500">Annulé</span> : 
                                        <span className="text-green-500">Actif</span>
                                    }
                                </td>
                                {actions && appt.status !== 'cancelled' && (
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                onClick={() => handleCancelAppointment(appt.id)}
                                                className="bg-amber-100 hover:bg-amber-200 text-deepRed px-2 py-1 rounded flex items-center"
                                            >
                                                <Trash2 className="mr-1" /> Annuler
                                            </button>
                                            <button 
                                                onClick={() => handleModify(appt.id)}
                                                className="bg-deepRed hover:bg-amber-100 text-white hover:text-deepRed px-2 py-1 rounded flex items-center"
                                            >
                                                <Edit className="mr-1" /> Modifier
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={actions ? 5 : 4} className="p-4 text-center text-gray-500">
                                Aucun rendez-vous à afficher dans cette catégorie
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    if (loading) {
        return <div className="text-center py-8">Chargement en cours...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    return (
        <div className="flex min-h-screen bg-amber-50">
            <div className="w-64 bg-amber-100 text-deepRed p-4 rounded-lg">
                <h2 className="text-3xl font-bold mb-6 text-deepRed">Smart-Agenda</h2>
                <div className="flex items-center mb-6">
                    <User className="mr-3 h-8 w-8 text-deepRed" />
                    <span className="font-semibold text-2xl text-deepRed">{username.toUpperCase()}</span>
                </div>
                <ul className="space-y-4 text-deepRed">
                    <li className="flex items-center cursor-pointer p-2 rounded hover:bg-amber-200" onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="mr-3 h-8 w-8 text-deepRed" /> Tableau de bord
                    </li>
                    <li className="flex items-center cursor-pointer p-2 rounded hover:bg-amber-200" onClick={() => navigate('/add-appointment')}>
                        <Plus className="mr-3 h-8 w-8 text-deepRed" /> Ajout Rendez-vous
                    </li>
                    <li className="flex items-center cursor-pointer p-2 rounded bg-amber-200">
                        <Calendar className="mr-3 h-8 w-8 text-deepRed" /> Liste Rendez-vous
                    </li>
                    <li className="flex items-center cursor-pointer hover:bg-amber-200 p-2 rounded" onClick={handleLogout}>
                        <LogOut className="mr-3 h-8 w-8 text-deepRed" /> Déconnexion
                    </li>
                </ul>
            </div>
            <div className="flex-1 p-8">
                <h1 className="text-4xl font-bold mb-6 text-deepRed text-center">Liste des Rendez-vous</h1>
                {renderTable('Rendez-vous en cours', appointments.current, true)}
                {renderTable('Rendez-vous annulés', appointments.cancelled)}
            </div>
        </div>
    );
};

export default AppointmentList;