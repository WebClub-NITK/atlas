import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { adminLogin as apiAdminLogin } from '../api/auth';

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
          setUser({
            id: decoded.user_id,
            email: decoded.email,
            isAdmin: true
          });
          setIsAdmin(true);
        } else {
          setUser({
            teamId: decoded.team_id,
            teamName: decoded.team_name,
            teamEmail: decoded.team_email,
            memberCount: decoded.member_count,
            memberEmails: decoded.member_emails
          });
          setIsAdmin(false);
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setToken({ access: null });
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    }
  }, []);

  const adminLogin = async (email, password) => {
    try {
      const response = await apiAdminLogin(email, password);
      localStorage.setItem('token', JSON.stringify(response));
      setToken(response);
      const decoded = decodeToken(response.access);
      
      setUser({
        id: decoded.user_id,
        email: decoded.email,
        isAdmin: true
      });
      
      setIsAuthenticated(true);
      setIsAdmin(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const login = (tokenData) => {
    localStorage.setItem('token', JSON.stringify(tokenData));
    setToken(tokenData);
    const decoded = decodeToken(tokenData.access);
    
    if (decoded.is_admin) {
      setUser({
        id: decoded.user_id,
        email: decoded.email,
        isAdmin: true
      });
      setIsAdmin(true);
    } else {
      setUser({
        teamId: decoded.team_id,
        teamName: decoded.team_name,
        teamEmail: decoded.team_email,
        memberCount: decoded.member_count,
        memberEmails: decoded.member_emails
      });
      setIsAdmin(false);
    }
    setIsAuthenticated(true);
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
      adminLogin,
      logout,
      isAuthenticated,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};