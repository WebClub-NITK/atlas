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
  const [token, setToken] = useState({ access: null }); 

  useEffect(() => {
    const tokenString = localStorage.getItem('token');
    if (tokenString) {
      try {
        const parsedToken = JSON.parse(tokenString);
        const decoded = jwtDecode(parsedToken.access);
        setToken(parsedToken);
        
        if (decoded.is_admin) {
          // Set admin user data
          setUser({
            id: decoded.user_id,
            email: decoded.email,
            username: decoded.username,
            isAdmin: true
          });
        } else {
          // Set team user data
          setUser({
            teamId: decoded.team_id,
            teamName: decoded.team_name,
            teamEmail: decoded.team_email,
            memberCount: decoded.member_count,
            memberEmails: decoded.member_emails
          });
        }
        
        setIsAuthenticated(true);
        setIsAdmin(decoded.is_admin || false);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setToken({ access: null });
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    }
  }, []);

  const login = (tokenData) => {
    localStorage.setItem('token', JSON.stringify(tokenData));
    setToken(tokenData);
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken({ access: null });
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};