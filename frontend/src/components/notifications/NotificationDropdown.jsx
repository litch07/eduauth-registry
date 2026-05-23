import { useState, useEffect, useRef } from 'react';
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

const TYPE_CONFIG = {
  ENROLLMENT: { icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  CERTIFICATE_ISSUED: { icon: Award, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  ACCESS_REQUEST: { icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  WITHDRAWAL: { icon: UserX, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  APPROVAL: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  PROFILE_CHANGE: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  INFO: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' }
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    let intervalId = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(fetchUnreadCount, 60000); // Poll every 60s
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount(); // Fetch immediately on tab reactivation
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (document.visibilityState === 'visible') {
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={cn(
                  "p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold",
                  unreadCount > 0
                    ? "text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:text-brand-300 dark:hover:bg-brand-950/40 cursor-pointer"
                    : "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                )}
                title={unreadCount > 0 ? "Mark all as read" : "All caught up!"}
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                You have no notifications.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => {
                  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.INFO;
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group flex gap-3",
                        !notification.is_read ? "bg-brand-50/30 dark:bg-brand-900/10" : ""
                      )}
                    >
                      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", config.bg, config.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm",
                            !notification.is_read ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap pt-0.5">
                            {notification.created_at_human}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm mt-0.5 line-clamp-2",
                          !notification.is_read ? "text-gray-600 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-brand-600 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-900/50 rounded-full transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full py-2 text-sm text-center font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              See All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
