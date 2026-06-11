import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  GraduationCap,
  Award,
  UserPlus,
  UserX,
  CheckCircle,
  Edit,
  Check,
  CheckCheck
} from 'lucide-react';
import api from '../../services/api';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { cn } from '../../utils/helpers';
import { useNotifications } from '../../contexts/NotificationContext';

const TYPE_CONFIG = {
  ENROLLMENT:        { icon: GraduationCap, color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  CERTIFICATE_ISSUED:{ icon: Award,         color: 'text-green-500',   bg: 'bg-green-100 dark:bg-green-900/30' },
  ACCESS_REQUEST:    { icon: UserPlus,      color: 'text-orange-500',  bg: 'bg-orange-100 dark:bg-orange-900/30' },
  WITHDRAWAL:        { icon: UserX,         color: 'text-red-500',     bg: 'bg-red-100 dark:bg-red-900/30' },
  APPROVAL:          { icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  PROFILE_CHANGE:    { icon: Edit,          color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  INFO:              { icon: Bell,          color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-800' },
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { unreadCount, setUnreadCount } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useOutsideClick(dropdownRef, closeDropdown);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id, { stopPropagation: () => { } });
    }
    setIsOpen(false);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[36px] h-[36px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-[var(--bg-surface)]">
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[400px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                  unreadCount > 0
                    ? "text-[var(--brand)] hover:bg-[var(--brand-light)] cursor-pointer"
                    : "text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                You have no notifications.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.map((notification) => {
                  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.INFO;
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-[12px_16px] min-h-[64px] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group flex gap-3",
                        !notification.is_read ? "border-l-[3px] border-l-[var(--brand)] bg-[rgba(var(--brand-rgb),0.3)]" : "border-l-[3px] border-l-transparent"
                      )}
                    >
                      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", config.bg, config.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                            {notification.title}
                          </p>
                          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                            {notification.created_at_human}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-[var(--border)]">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full py-2 text-sm text-center font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
