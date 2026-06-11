import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap, 
  Award, 
  UserPlus, 
  UserX, 
  CheckCircle, 
  Edit
} from 'lucide-react';
import api from '../../services/api';
import { cn, formatDateTime } from '../../utils/helpers';
import { useNotifications } from '../../contexts/NotificationContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

const TYPE_CONFIG = {
  ENROLLMENT: { icon: GraduationCap, color: 'text-[var(--brand)]', bg: 'bg-[var(--brand-light)] ' },
  CERTIFICATE_ISSUED: { icon: Award, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10 ' },
  ACCESS_REQUEST: { icon: UserPlus, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10 ' },
  WITHDRAWAL: { icon: UserX, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10 ' },
  APPROVAL: { icon: CheckCircle, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10 ' },
  PROFILE_CHANGE: { icon: Edit, color: 'text-[var(--brand)]', bg: 'bg-[var(--brand-light)] ' },
  INFO: { icon: Bell, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg-elevated)] ' }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });
  
  const navigate = useNavigate();
  const { setUnreadCount } = useNotifications();

  const fetchNotifications = async (page = 1, currentFilter = filter) => {
    setLoading(true);
    try {
      const params = { page };
      if (currentFilter !== 'all') {
        params.filter = currentFilter;
      }
      const { data } = await api.get('/notifications/all', { params });
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter]);

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (filter === 'unread') {
        fetchNotifications(pagination.current_page, filter);
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      if (filter === 'unread') {
        fetchNotifications(1, filter);
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchNotifications(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Stay updated with your latest activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-[var(--bg-elevated)] p-1 border border-[var(--border)]">
              {['all', 'unread', 'read'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all",
                    filter === tab
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--brand)]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                <Bell className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">No notifications</h3>
              <p className="mt-1 text-[var(--text-secondary)]">
                {filter === 'all' 
                  ? "You're all caught up! There are no notifications to show."
                  : `You have no ${filter} notifications.`}
              </p>
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
                      "group relative flex gap-4 p-5 transition-colors cursor-pointer hover:bg-[var(--bg-elevated)]",
                      !notification.is_read ? "bg-[var(--brand)]/[0.05]" : ""
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                      config.bg, config.color
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-sm font-semibold",
                          !notification.is_read ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                          {formatDateTime(notification.created_at)}
                        </span>
                      </div>
                      <p className={cn(
                        "mt-1 text-sm",
                        !notification.is_read ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                      )}>
                        {notification.message}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="flex shrink-0 items-center justify-center">
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="rounded-full p-2 text-[var(--brand)] opacity-0 transition-all hover:bg-[var(--bg-elevated)] group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Showing <span className="font-medium text-[var(--text-primary)]">{((pagination.current_page - 1) * 20) + 1}</span> to{' '}
                  <span className="font-medium text-[var(--text-primary)]">
                    {Math.min(pagination.current_page * 20, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium text-[var(--text-primary)]">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-elevated)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-elevated)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
