import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { register, login as apiLogin } from '../api/auth'; // Ensure these imports are correct

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState({
    access: null,
    refresh: null,
  });
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check for token in localStorage on initial load
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const parsedToken = JSON.parse(storedToken);
          if (parsedToken && isTokenValid(parsedToken.access)) {
            const userData = parseToken(parsedToken.access);
            setUser(userData);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const parseToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        token,
        id: decoded.user.id,
        email: decoded.user.email,
        teamName: decoded.user.teamName, // Changed from username
        isAdmin: decoded.user.isAdmin,
        isVerified: decoded.user.isVerified,
        teamId: decoded.user.teamId || null,
      };
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  const login = (response) => {
    const { access } = response;
    const decodedAccess = jwtDecode(access);
    const user = {
      token: access,
      id: decodedAccess.user.id,
      email: decodedAccess.user.email,
      teamName: decodedAccess.user.teamName, // Changed from username
      isAdmin: decodedAccess.user.isAdmin,
      isVerified: decodedAccess.user.isVerified,
      teamId: decodedAccess.user.teamId || null,
    };

    // console.log('User:', user);
    if (isTokenValid(access)) {
      localStorage.setItem('token', JSON.stringify({ access }));
      setToken({ access });
      setUser(user);
    } else {
      console.error('Invalid token on login');
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken({ access: null });
    setUser(null);
  };

  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  };

  const signup = async (data) => {
    try {
      const response = await register(data.username, data.email, data.password);
      login(response);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        isAuthenticated,
        loading, // Expose loading state
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
