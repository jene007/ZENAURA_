import axios from 'axios';

// Default to the deployed backend if REACT_APP_API_URL is not set.
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'https://zenaura-01.onrender.com/api' });

export const setAuthToken = token => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export default API;
