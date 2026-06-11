import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  // Pull the auth context to read server-saved theme preference.
  // useAuth() is safe here because ThemeProvider is always nested inside AuthProvider.
  const auth = useAuth();

  const applyTheme = useCallback((themeValue) => {
    if (themeValue === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', themeValue === 'dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Sync theme from server-saved user settings.
  // Fires when settings load after login or on initial mount with a stored user.
  // This ensures the theme the user set in their account follows them across devices/browsers.
  useEffect(() => {
    const serverTheme = auth?.settings?.display?.theme;
    if (serverTheme && ['light', 'dark', 'system'].includes(serverTheme)) {
      setThemeState(serverTheme);
      localStorage.setItem('theme', serverTheme);
    }
  }, [auth?.settings?.display?.theme]);

  const saveThemePreference = useCallback(async (newTheme) => {
    if (auth?.user) {
      try {
        await api.put('/settings', { settings: { display: { theme: newTheme } } });
      } catch (err) {
        console.error('Failed to save theme preference', err);
      }
    }
  }, [auth?.user]);

  const setTheme = useCallback((value) => {
    setThemeState(value);
    saveThemePreference(value);
  }, [saveThemePreference]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      // Determine what the user actually sees right now
      const isCurrentlyDark = current === 'dark' || (current === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      // Toggle it
      const newTheme = isCurrentlyDark ? 'light' : 'dark';
      
      saveThemePreference(newTheme);
      return newTheme;
    });
  }, [saveThemePreference]);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const value = useMemo(() => ({
    isDark, theme, setTheme, toggleTheme
  }), [isDark, theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
