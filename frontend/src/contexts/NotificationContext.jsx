import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

function normalizeNotifications(items, previous = []) {
  const previousById = new Map(previous.map((item) => [item.id, item]));

  return items.map((item) => ({
    ...item,
    read: previousById.get(item.id)?.read ?? false,
  }));
}

function buildStudentNotifications(data) {
  const notifications = [];

  for (const request of data?.requests || []) {
    if (request.status === 'pending') {
      notifications.push({
        id: `student-request-pending-${request.id}`,
        type: 'access-requested',
        title: 'Access requested',
        message: `${request.verifier?.company_name || 'A verifier'} requested access to your certificates.`,
        createdAt: request.created_at,
      });
    }

    if (request.status === 'approved') {
      notifications.push({
        id: `student-request-approved-${request.id}`,
        type: 'access-approved',
        title: 'Access approved',
        message: `${request.verifier?.company_name || 'A verifier'} was approved for ${request.access_duration_days || 'an'} access period.`,
        createdAt: request.responded_at || request.updated_at || request.created_at,
      });
    }

    if (request.status === 'rejected') {
      notifications.push({
        id: `student-request-rejected-${request.id}`,
        type: 'access-rejected',
        title: 'Access rejected',
        message: `${request.verifier?.company_name || 'A verifier'} was rejected for certificate access.`,
        createdAt: request.responded_at || request.updated_at || request.created_at,
      });
    }
  }

  for (const access of data?.accesses || []) {
    if (access.revoked_at) {
      notifications.push({
        id: `student-access-revoked-${access.id}`,
        type: 'access-revoked',
        title: 'Access revoked',
        message: `${access.verifier?.company_name || 'A verifier'} no longer has access to your certificates.`,
        createdAt: access.revoked_at,
      });
    }
  }

  return notifications;
}

function buildVerifierNotifications(data) {
  const notifications = [];

  for (const request of data?.requests || []) {
    if (request.status === 'approved') {
      notifications.push({
        id: `verifier-request-approved-${request.id}`,
        type: 'access-approved',
        title: 'Access approved',
        message: `Your request for ${request.student?.user?.name || 'a student'} was approved.`,
        createdAt: request.responded_at || request.updated_at || request.created_at,
      });
    }

    if (request.status === 'rejected') {
      notifications.push({
        id: `verifier-request-rejected-${request.id}`,
        type: 'access-rejected',
        title: 'Access rejected',
        message: `Your request for ${request.student?.user?.name || 'a student'} was rejected.`,
        createdAt: request.responded_at || request.updated_at || request.created_at,
      });
    }
  }

  for (const access of data?.accesses || []) {
    if (access.revoked_at) {
      notifications.push({
        id: `verifier-access-revoked-${access.id}`,
        type: 'access-revoked',
        title: 'Access revoked',
        message: `Access to ${access.student?.user?.name || 'a student'}'s certificates was revoked.`,
        createdAt: access.revoked_at,
      });
    }
  }

  return notifications;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const storageKey = useMemo(() => (user?.id ? `notifications:${user.id}` : null), [user?.id]);

  useEffect(() => {
    if (!storageKey) {
      setNotifications([]);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setNotifications(Array.isArray(stored) ? stored : []);
    } catch {
      setNotifications([]);
    }
  }, [storageKey]);

  const persist = (nextNotifications) => {
    setNotifications(nextNotifications);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(nextNotifications));
    }
  };

  const refreshNotifications = async () => {
    if (!user) {
      persist([]);
      return [];
    }

    setLoading(true);
    try {
      let fetched = [];

      if (user.role === 'student') {
        const [{ data: requestsData }, { data: accessesData }] = await Promise.all([
          api.get('/student/access-requests'),
          api.get('/student/granted-access'),
        ]);

        fetched = buildStudentNotifications({
          requests: [...(requestsData.pending_requests || []), ...(requestsData.history || [])],
          accesses: accessesData.accesses || [],
        });
      }

      if (user.role === 'verifier') {
        const [{ data: requestsData }, { data: accessesData }] = await Promise.all([
          api.get('/verifier/access-requests'),
          api.get('/verifier/accessible-students'),
        ]);

        fetched = buildVerifierNotifications({
          requests: requestsData.requests || [],
          accesses: accessesData.accesses || [],
        });
      }

      const merged = normalizeNotifications(
        fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        notifications,
      );
      persist(merged);
      return merged;
    } catch (error) {
      return notifications;
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (notification) => {
    const nextNotifications = normalizeNotifications([
      notification,
      ...notifications,
    ], notifications);
    persist(nextNotifications);
  };

  const markAllAsRead = () => {
    persist(notifications.map((notification) => ({ ...notification, read: true })));
  };

  const markAsRead = (notificationId) => {
    persist(notifications.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )));
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      loading,
      unreadCount,
      refreshNotifications,
      addNotification,
      markAllAsRead,
      markAsRead,
    }}>
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
