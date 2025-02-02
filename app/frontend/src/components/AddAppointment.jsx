import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAppointments } from '../hooks/useAppointments';




// AddAppointment.js
const AddAppointment = () => {
  const { handleAdd } = useAppointments();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const checkTimeSlotValidity = (date, time) => {
    const appointmentDate = new Date(date);
    const appointmentHour = parseInt(time.split(':')[0], 10);
    const appointmentMinute = parseInt(time.split(':')[1], 10);
    const dayOfWeek = appointmentDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      if ((appointmentHour < 8 || (appointmentHour === 14 && appointmentMinute > 0)) &&
          (appointmentHour < 15 || (appointmentHour === 18 && appointmentMinute > 0))) {
        return false;
      }
    }

    if (dayOfWeek === 5) {
      if ((appointmentHour < 8 || (appointmentHour === 13 && appointmentMinute > 30)) &&
          (appointmentHour < 15 || (appointmentHour === 18 && appointmentMinute > 0))) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedDate || !selectedTime || !appointmentType) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (!checkTimeSlotValidity(selectedDate, selectedTime)) {
      setError('Le rendez-vous ne respecte pas les créneaux horaires.');
      return;
    }

    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const data = {
      date: appointmentDateTime.toISOString(),
      type: appointmentType,
      title: appointmentType
    };

    try {
      const success = await handleAdd(data);
      if (success) {
        navigate('/appointment-list');
      }
    } catch (error) {
      setError('Erreur lors de la création du rendez-vous');
      console.error('Erreur détaillée:', error);
    }
  };

  // ... reste du JSX de votre composant AddAppointment



  return (
    <div className="flex items-center justify-end h-screen bg-cover bg-center bg-no-repeat text-[#210202] px-12" style={{ backgroundImage: "url('/images/back6.jpg')" }}>
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-bold text-left mb-8">Remplir le Formulaire de Rendez-vous</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="date" className="block font-semibold">Date :</label>
            <input 
              type="date" 
              id="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              required 
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div>
            <label htmlFor="time" className="block font-semibold">Heure :</label>
            <input 
              type="time" 
              id="time" 
              value={selectedTime} 
              onChange={(e) => setSelectedTime(e.target.value)} 
              required 
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div>
            <label htmlFor="appointmentType" className="block font-semibold"> Description :</label>
            <input 
              type="text" 
              id="appointmentType" 
              value={appointmentType} 
              onChange={(e) => setAppointmentType(e.target.value)} 
              required 
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div className="flex justify-between space-x-4">
          <button 
              type="submit" 
              className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]"
            >
              Ajouter Rendez-vous
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
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

export default AddAppointment;
