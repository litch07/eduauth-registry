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
import { cn } from '../../utils/helpers';
import DashboardLayout from '../../components/layout/DashboardLayout';

const TYPE_CONFIG = {
  ENROLLMENT: { icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  CERTIFICATE_ISSUED: { icon: Award, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  ACCESS_REQUEST: { icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  WITHDRAWAL: { icon: UserX, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  APPROVAL: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  PROFILE_CHANGE: { icon: Edit, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  INFO: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' }
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
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Stay updated with your latest activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {['all', 'unread', 'read'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all",
                    filter === tab
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all as read</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600 dark:border-gray-700 dark:border-t-brand-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No notifications</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {filter === 'all' 
                  ? "You're all caught up! There are no notifications to show."
                  : `You have no ${filter} notifications.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.INFO;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "group relative flex gap-4 p-5 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      !notification.is_read ? "bg-brand-50/20 dark:bg-brand-900/10" : ""
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
                          !notification.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {notification.created_at_human}
                        </span>
                      </div>
                      <p className={cn(
                        "mt-1 text-sm",
                        !notification.is_read ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {notification.message}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="flex shrink-0 items-center justify-center">
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="rounded-full p-2 text-brand-600 opacity-0 transition-all hover:bg-brand-100 group-hover:opacity-100 dark:text-brand-400 dark:hover:bg-brand-900/50"
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
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{((pagination.current_page - 1) * 20) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current_page * 20, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
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
