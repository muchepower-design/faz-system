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
          // Merge: use userData fields, but ensure role is set from decoded token if missing
          setUser({ ...userData, role: userData.role || decoded.role });
        } else {
          // Fallback: only username and role from token
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

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      const decoded = jwtDecode(access_token);
      setUser({ ...userData, role: userData.role || decoded.role });
      return { success: true, user: userData };
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
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user, hasRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
};