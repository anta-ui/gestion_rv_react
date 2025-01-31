import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setCredentials } from '../features/authSlice';
import api from '../services/api';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('token/', {
        username: formData.username,
        password: formData.password,
      });

      if (response.data.access) {
        // Stockage du token dans localStorage
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('user', JSON.stringify({ username: formData.username }));

        // Configuration du header d'autorisation pour les futures requêtes
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

        // Mise à jour du state Redux
        dispatch(setCredentials({
          token: response.data.access,
          user: { username: formData.username },
        }));

        // Redirection vers le dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = `Nom d'utilisateur ou mot de passe incorrect`;
            break;
          case 400:
            errorMessage = 'Veuillez remplir tous les champs correctement';
            break;
          case 500:
            errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
            break;
          default:
            errorMessage = error.response.data?.detail || errorMessage;
        }
      }

      setError(errorMessage);
      console.error('Login error:', error);
      
      // Nettoyage en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      api.defaults.headers.common['Authorization'] = null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end h-screen bg-cover bg-center bg-no-repeat text-[#210202] px-12"
      style={{ backgroundImage: "url('/images/back6.jpg')" }}>
      <div className="w-full max-w-md">
        <h2 className="text-6xl font-bold text-left mb-8">Connexion</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="username" className="block font-semibold">Nom d'utilisateur :</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={loading}
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
              disabled={loading}
              className="w-full px-4 py-2 border-b border-[#210202] focus:outline-none bg-transparent text-[#210202]"
            />
          </div>
          <div className="flex justify-end space-x-4">
          <button
              type="submit"
              className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <Link to="/" className="px-5 py-2 bg-[#210202] text-white rounded-lg hover:bg-[#582900]">
              Retour
            </Link>
            
          </div>
        </form>
      </div>
    </div>
  );
}