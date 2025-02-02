import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const EditAppointment = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState({
        date: '',       // Date au format YYYY-MM-DD
        time: '',       // Heure au format HH:MM
        description: '' // Description du rendez-vous
    });

    useEffect(() => {
        // Charger les données du rendez-vous
        const fetchAppointment = async () => {
            try {
                const response = await api.get(`/appointments/${appointmentId}/`);
                const appointmentDate = new Date(response.data.date);
                setAppointment({
                    date: appointmentDate.toISOString().split('T')[0], // Extraire la date (YYYY-MM-DD)
                    time: appointmentDate.toTimeString().split(' ')[0].substring(0, 5), // Extraire l'heure (HH:MM)
                    description: response.data.description
                });
            } catch (error) {
                console.error('Erreur lors du chargement du rendez-vous:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            }
        };
        fetchAppointment();
    }, [appointmentId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Combiner la date et l'heure pour créer un objet Date
            const dateTime = new Date(`${appointment.date}T${appointment.time}:00`);
            const isoDateTime = dateTime.toISOString(); // Convertir en format ISO pour l'API

            // Envoyer les données à l'API
            const response = await api.put(`/appointments/${appointmentId}/update/`, {
                date: isoDateTime,
                description: appointment.description
            });

            if (response.data.status === 'success') {
                navigate('/appointments');
            }
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            alert('Erreur lors de la modification du rendez-vous');
        }
    };

    return (
        <div className="flex items-center justify-end h-screen bg-cover bg-center bg-no-repeat text-[#210202] px-12"
            style={{ backgroundImage: "url('/images/back6.jpg')" }}>
            <div className="w-full max-w-md">
                <h2 className="text-6xl font-bold text-left mb-8 text-[#210202]">Modifier le rendez-vous</h2>
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div>
                        <label htmlFor="date" className="block font-semibold text-[#210202]">Date :</label>
                        <input
                            type="date"
                            id="date"
                            value={appointment.date}
                            onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
                            required
                            className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
                        />
                    </div>
                    <div>
                        <label htmlFor="time" className="block font-semibold text-[#210202]">Heure :</label>
                        <input
                            type="time"
                            id="time"
                            value={appointment.time}
                            onChange={(e) => setAppointment({ ...appointment, time: e.target.value })}
                            required
                            className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block font-semibold text-[#210202]">Description :</label>
                        <textarea
                            id="description"
                            value={appointment.description}
                            onChange={(e) => setAppointment({ ...appointment, description: e.target.value })}
                            required
                            className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="submit"
                            className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]"
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/appointments')}
                            className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAppointment;