import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Ajouter un intercepteur pour insérer le token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Ajouter un intercepteur pour gérer les erreurs de réponse (par exemple, token expiré)
api.interceptors.response.use(
    response => response,
    (error) => {
        const navigate = useNavigate();
        if (error.response && error.response.status === 401) {
            // Rediriger vers la page de connexion en cas de token expiré ou invalide
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
        return Promise.reject(error);
    }
);
// Ajouter le token à chaque requête
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
export default api;
