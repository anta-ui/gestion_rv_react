import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register ()  {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);  // Nouvel état pour suivre le chargement
  const [error, setError] = useState('');  // Nouvel état pour gérer les erreurs
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');  // Réinitialiser les erreurs à chaque tentative d'envoi

    try {
      await api.post('register/', formData);
      navigate('/login');
    } catch (error) {
      setError('Erreur d\'inscription, veuillez réessayer.');  // Affichage de l'erreur
      console.error('Registration error:', error);
    } finally {
      setLoading(false);  // Réinitialiser l'état de chargement
    }
  };

  return (
    <div className="flex items-center justify-end h-screen bg-cover bg-center bg-no-repeat text-[#210202] px-12" style={{ backgroundImage: "url('/images/back6.jpg')" }}>
      <div className="w-full max-w-md">
        <h2 className="text-6xl font-bold text-left mb-8">Inscription</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}  {/* Affichage du message d'erreur */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="username" className="block font-semibold">Nom d'utilisateur :</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-semibold">Email :</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-semibold">Mot de passe :</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button 
              type="submit" 
              className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]"
              disabled={loading}  // Désactiver le bouton pendant le chargement
            >
              {loading ? 'Chargement...' : "S'inscrire"}  {/* Afficher un texte différent pendant le chargement */}
            </button>
            <a href="/" className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]">Retour</a>
          </div>
        </form>
      </div>
    </div>
  );
};
