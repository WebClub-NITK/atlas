import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for token on load
    const token = localStorage.getItem('token');
    console.log('Initial token check:', !!token);
    
    if (token) {
      try {
        const decoded = jwtDecode(JSON.parse(token).access);
        console.log('Token decoded successfully:', decoded);
        
        setUser({
          teamId: decoded.team_id,
          teamName: decoded.team_name,
          teamEmail: decoded.team_email,
          memberCount: decoded.member_count,
          memberEmails: decoded.member_emails
        });
        setIsAuthenticated(true);
        setIsAdmin(decoded.is_admin || false);
        console.log('Auth state set to true on load');
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const login = (tokenData) => {
    console.log('Login called with token data:', tokenData);
    
    localStorage.setItem('token', JSON.stringify(tokenData));
    const decoded = decodeToken(tokenData.access);
    
    setUser({
      teamId: decoded.team_id,
      teamName: decoded.team_name,
      teamEmail: decoded.team_email,
      memberCount: decoded.member_count,
      memberEmails: decoded.member_emails
    });
    setIsAuthenticated(true);
    setIsAdmin(decoded?.is_admin || false);
    console.log('Auth state set to true after login');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    console.log('Auth state set to false after logout');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin
  };

  console.log('Current auth state:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
