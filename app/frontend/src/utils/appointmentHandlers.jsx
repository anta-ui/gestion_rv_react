import api from '../services/api';


export const appointmentHandlers = {
 handleCancel :async(id, fetchStats) => {
  try {
    if (window.confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
      const response = await api.post(`/appointments/${id}/cancel/`, {}, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 200) {
        await fetchStats();  // ✅ fetchStats est maintenant passé en paramètre
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error.response?.data || error.message);
    alert('Erreur lors de l\'annulation du rendez-vous');
  }
},

 handleAddAppointment :async (appointmentData, fetchStats) => {
  try {
    await api.post('appointments/', appointmentData, {
      headers: { "Content-Type": "application/json" }
    });

    await fetchStats();  // ✅ fetchStats est maintenant passé en paramètre
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error.response?.data || error.message);
    return false;
  }
},
};