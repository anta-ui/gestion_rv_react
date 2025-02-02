// context/AuthContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../features/authSlice';

const AuthContext = createContext(
  {
    logout: () => {},
  }
);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Vérifier si un token existe dans le localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedToken && !token) {
      dispatch(setCredentials({ token: storedToken, user: storedUser }));
    }
  }, [dispatch, token]);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Garde uniquement CETTE exportation
export const useAuth = () => useContext(AuthContext);
