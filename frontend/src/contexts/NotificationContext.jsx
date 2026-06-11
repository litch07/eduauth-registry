import { createContext, useContext, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

/**
 * NotificationProvider
 *
 * Provides a lightweight, real-API-backed notification context.
 * - `unreadCount`   — live count from /notifications/unread-count
 * - `refreshCount`  — manually re-fetch the unread count (e.g. after an action)
 * - `setUnreadCount` — manually update unread count
 */
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // Silently fail — badge will stay at last known value
    }
  }, [user]);

  const startPolling = useCallback(() => {
    intervalRef.current = setInterval(refreshCount, 60000);
  }, [refreshCount]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Fetch on mount and start polling
  useEffect(() => {
    if (!user) return; // Auth guard

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        refreshCount();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    refreshCount();
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, refreshCount, startPolling, stopPolling]);

  const value = useMemo(() => ({
    unreadCount,
    setUnreadCount,
    refreshCount
  }), [unreadCount, refreshCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
