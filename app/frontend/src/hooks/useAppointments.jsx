import { useState, useCallback } from 'react';
import api from '../services/api';

export function useAppointments() {
  const [appointmentsStats, setAppointmentsStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    canceled: 0
  });
  const [appointments, setAppointments] = useState({
    current: [],
    past: [],
    canceled: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
        const [appointmentsResponse, statsResponse] = await Promise.all([
            api.get('appointments/'),
            api.get('appointments/stats/')
        ]);
        
        setAppointments({
            current: appointmentsResponse.data.filter(a => !a.cancelled && new Date(a.date) >= new Date()),
            past: appointmentsResponse.data.filter(a => !a.cancelled && new Date(a.date) < new Date()),
            canceled: appointmentsResponse.data.filter(a => a.cancelled)
        });
        
        setAppointmentsStats({
            total: statsResponse.data.total_appointments,
            completed: statsResponse.data.past_appointments,
            scheduled: statsResponse.data.upcoming_appointments,
            canceled: statsResponse.data.canceled_appointments
        });
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}, []);

const handleCancel = async (appointmentId) => {
  try {
      const response = await api.post(`/appointments/${appointmentId}/cancel/`);
      
      if (response.data.status === 'success') {
          // Mettre à jour l'état local avec les nouvelles données
          if (response.data.stats) {
              setAppointmentsStats({
                  total: response.data.stats.total_appointments,
                  completed: response.data.stats.past_appointments,
                  scheduled: response.data.stats.upcoming_appointments,
                  canceled: response.data.stats.canceled_appointments
              });
          }
          
          // Rafraîchir la liste des rendez-vous
          await fetchStats();
          return true;
      } else {
          console.error('Erreur:', response.data.message);
          return false;
      }
  } catch (error) {
      console.error('Erreur lors de l\'annulation du rendez-vous:', error);
      return false;
  }
};
const handleAdd = async (appointmentData) => {
  try {
    const response = await api.post('/appointments/', {
      date: appointmentData.date,
      description: appointmentData.description  // Assurez-vous de passer la description
    });
    return true; // Retourner true si la requête est réussie
  } catch (error) {
    console.error("Erreur lors de l'ajout:", error);
    return false;
  }
};


  return {
    appointmentsStats,
    appointments,
    loading,
    error,
    fetchStats,
    handleCancel,
    handleAdd
  };
}
