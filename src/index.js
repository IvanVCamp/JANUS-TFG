import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { createStore } from 'redux'; // Importa createStore desde 'redux'
import './styles/main.css';

const dummyReducer = (state = {}) => state;
const store = createStore(dummyReducer);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
