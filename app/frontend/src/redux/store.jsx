import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers'; // Assure-toi que ton reducer est bien importé

const store = configureStore({
  reducer: {
    auth: authReducer, // L'état de l'authentification doit être sous 'auth'
  },
});

export default store;
