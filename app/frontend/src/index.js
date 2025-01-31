import { Provider } from 'react-redux';
import store from './redux/store'; // Vérifie le chemin
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);


<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <App />
</BrowserRouter>


