import React, { createContext, useState, useEffect, useCallback } from 'react';
import API, { setAuthToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('zenaura_token');
    if (token) {
      setAuthToken(token);
      API.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          setAuthToken(null);
          localStorage.removeItem('zenaura_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async token => {
    if (!token) return;
    localStorage.setItem('zenaura_token', token);
    setAuthToken(token);
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // call backend to revoke the token (best-effort, ignore errors)
      await API.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('zenaura_token');
  }, []);

  // auto-logout on 401 responses (token expired/invalid)
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      res => res,
      err => {
        if (err && err.response && err.response.status === 401) {
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => API.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
