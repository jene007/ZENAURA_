import axios from 'axios';

// Vite exposes env vars on import.meta.env and only variables
// prefixed with VITE_ are exposed to the client. `process` is
// not defined in the browser which caused the runtime error.
// Default to the deployed backend if VITE_API_URL is not set in the environment.
// Change this to your Render backend if you use a different host.
const baseURL = import.meta.env.VITE_API_URL || 'https://zenaura-01.onrender.com/api';
const API = axios.create({ baseURL });

export const setAuthToken = token => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export default API;
