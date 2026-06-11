import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings);
    } catch {
      // Non-fatal — settings will use defaults
    }
  }, []);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Load saved settings so ThemeContext can sync the server-saved theme
      fetchSettings();
    }
    setLoading(false);
  }, [fetchSettings]);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    // Load settings right after login so ThemeContext can apply the saved theme
    fetchSettings();
    return data;
  }, [fetchSettings]);

  const refreshUser = useCallback(async () => {
    const data = await authService.getCurrentUser();
    if (data?.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }, []);

  const updateLocalUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setSettings(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    settings,
    login,
    logout,
    refreshUser,
    updateLocalUser,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isUniversity: user?.role === 'university',
    isVerifier: user?.role === 'verifier',
    isAdmin: user?.role === 'admin',
  }), [user, settings, loading, login, logout, refreshUser, updateLocalUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
