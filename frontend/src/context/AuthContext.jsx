import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { adminLogin as apiAdminLogin } from '../api/auth';

export const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    if (!token) return null;
    return jwtDecode(token);
  } catch (error) {
    console.error('AuthContext: Error decoding token:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState({ access: null, refresh: null });

  useEffect(() => {
    console.log("AuthContext: Initializing AuthProvider...");
    const tokenString = localStorage.getItem('token');
    if (tokenString) {
      console.log("AuthContext: Found token in localStorage:", tokenString);
      try {
        const parsedToken = JSON.parse(tokenString);
        if (parsedToken && parsedToken.access) {
           console.log("AuthContext: Parsed token:", parsedToken);
           login(parsedToken, true);
        } else {
           console.warn("AuthContext: Parsed token is invalid or missing access token.");
           logout();
        }
      } catch (error) {
        console.error('AuthContext: Error parsing token from localStorage:', error);
        logout();
      }
    } else {
       console.log("AuthContext: No token found in localStorage.");
    }
  }, []);

  const adminLogin = async (email, password) => {
     console.log("AuthContext: Attempting admin login for email:", email);
    try {
      const response = await apiAdminLogin(email, password);
      console.log("AuthContext: Admin login API response:", response);
      if (response.access && response.refresh) {
        login(response);
        return response;
      } else {
         throw new Error("Admin login response missing tokens");
      }
    } catch (error) {
      console.error('AuthContext: Admin login failed:', error);
      logout();
      throw error;
    }
  };

  const login = (tokenData, isInitialLoad = false) => {
    console.log(`AuthContext: login function called. Initial load: ${isInitialLoad}. Token data received:`, tokenData);

    if (!tokenData || !tokenData.access) {
       console.error("AuthContext: login function called with invalid tokenData.");
       logout();
       return;
    }

    const decoded = decodeToken(tokenData.access);
    console.log('AuthContext: Decoded access token:', decoded);

    if (decoded) {
      if (!isInitialLoad) {
         console.log("AuthContext: Storing new token in localStorage.");
         localStorage.setItem('token', JSON.stringify(tokenData));
      }

      setToken({ access: tokenData.access, refresh: tokenData.refresh });

      if (decoded.is_admin) {
        console.log("AuthContext: Setting user as ADMIN.");
        setUser({
          id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          isAdmin: true,
        });
        setIsAdmin(true);
      } else {
        console.log("AuthContext: Setting user as REGULAR USER.");
        setUser({
          id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          isAdmin: false,
          teamId: decoded.team_id || null,
          team_id: decoded.team_id || null,
          teamName: decoded.team_name || null,
          teamEmail: decoded.team_email || null,
          isTeamOwner: decoded.is_team_owner || false,
          memberCount: decoded.member_count || 0,
          teamAccessCode: decoded.team_access_code || null,
        });
        setIsAdmin(false);
      }
      setIsAuthenticated(true);
      console.log("AuthContext: User state updated:", user);
      console.log("AuthContext: isAuthenticated set to true.");

    } else {
      console.error("AuthContext: Failed to decode token. Logging out.");
      logout();
    }
  };

  const logout = () => {
    console.log("AuthContext: Logging out user.");
    localStorage.removeItem('token');
    setToken({ access: null, refresh: null });
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
     console.log("AuthContext: User logged out, state cleared.");
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