import axios from 'axios';

// Vite exposes env vars on import.meta.env and only variables
// prefixed with VITE_ are exposed to the client. `process` is
// not defined in the browser which caused the runtime error.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API = axios.create({ baseURL });

export const setAuthToken = token => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export default API;
