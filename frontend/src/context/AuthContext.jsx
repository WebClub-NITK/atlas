import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { register, login } from '../api/auth'; // Ensure these imports are correct
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp > Date.now() / 1000) {
          setUser(decoded.user);
          apiClient.defaults.headers.Authorization = `Bearer ${token}`;
        } else {
          handleLogout();
        }
      } catch (error) {
        handleLogout();
      }
    }
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      apiClient.defaults.headers.Authorization = `Bearer ${data.token}`;
      setUser(jwtDecode(data.token).user);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
