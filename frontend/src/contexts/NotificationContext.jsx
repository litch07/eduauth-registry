import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

/**
 * NotificationProvider
 *
 * Provides a lightweight, real-API-backed notification context.
 * - `unreadCount`   — live count from /notifications/unread-count
 * - `refreshCount`  — manually re-fetch the unread count (e.g. after an action)
 *
 * The bell dropdown manages its own notification list directly; this context
 * exists so other parts of the app (e.g. mobile nav badges) can read the
 * count without duplicating the fetch logic.
 */
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Fetch on mount and whenever the logged-in user changes
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount }}>
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
