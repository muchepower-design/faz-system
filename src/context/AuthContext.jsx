// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser({ ...userData, role: userData.role || decoded.role });
        } else {
          setUser({ username: decoded.sub, role: decoded.role });
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Shared helper — persist a login result (from password or Google)
  const applyLoginResult = (access_token, userData) => {
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    const decoded = jwtDecode(access_token);
    setUser({ ...userData, role: userData.role || decoded.role });
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;
      applyLoginResult(access_token, userData);
      return { success: true, user: userData };
    } catch (error) {
      throw error;
    }
  };

  // NEW — Google sign-in. `idToken` comes from Google Identity Services.
  const loginWithGoogle = async (idToken) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      const { access_token, user: userData, new_user } = response.data;
      applyLoginResult(access_token, userData);
      return { success: true, user: userData, new_user };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, logout, loading, isAuthenticated: !!user, hasRole, hasAnyRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};