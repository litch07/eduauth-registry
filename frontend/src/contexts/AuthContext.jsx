import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  }, []);

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
    }
  }, []);

  const value = {
    user,
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
