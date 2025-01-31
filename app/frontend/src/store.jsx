// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice'; // Assurez-vous que vous avez un authSlice

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
