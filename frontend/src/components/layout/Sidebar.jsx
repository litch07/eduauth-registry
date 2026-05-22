import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, LayoutDashboard, SquarePen, Users, XCircle, ScanSearch, BarChart, Layers, MessageSquare, FileText, ShieldCheck, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';
import api from '../../services/api';

const navItems = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/my-university', label: 'My University', icon: Layers },
    { to: '/student/certificates', label: 'Certificates', icon: BookOpen },
    { to: '/student/access-requests', label: 'Access Requests', icon: Users },
  ],
  university: [
    { to: '/university/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/university/certificates', label: 'Certificates', icon: BookOpen },
    { to: '/university/enrollments', label: 'Enrollments', icon: Users },
    { to: '/university/issue-certificate', label: 'Issue Certificate', icon: SquarePen },
  ],
  verifier: [
    { to: '/verifier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verifier/verify-certificate', label: 'Verify Certificate', icon: ShieldCheck },
    { to: '/verifier/access-requests', label: 'Access Requests', icon: Users },
    { to: '/verifier/accessible-certificates', label: 'Accessible Certificates', icon: BookOpen },
    { to: '/verifier/verification-history', label: 'Verification History', icon: History },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/certificates', label: 'Certificates', icon: BookOpen },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart },
    { to: '/admin/profile-change-requests', label: 'Profile Requests', icon: FileText },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = navItems[user?.role] || [];
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [pendingProfileChanges, setPendingProfileChanges] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);

  useEffect(() => {
    if (user?.role === 'university') {
      const fetchCount = async () => {
        try {
          const { data } = await api.get('/university/withdrawal/pending');
          setPendingWithdrawals(data.requests?.length || 0);
        } catch (e) {}
      };
      
      fetchCount();

      const handleUpdate = () => fetchCount();
      window.addEventListener('withdrawal_requests_updated', handleUpdate);
      return () => window.removeEventListener('withdrawal_requests_updated', handleUpdate);
    }

    if (user?.role === 'admin') {
      const fetchProfileChangeCount = async () => {
        try {
          const { data } = await api.get('/admin/profile-change-requests', { params: { status: 'pending' } });
          setPendingProfileChanges(data.pending_count || 0);
        } catch (_e) {}
      };

      const fetchPendingUsersCount = async () => {
        try {
          const { data } = await api.get('/admin/users', { params: { per_page: 1, status: 'pending' } });
          setPendingUsers(data.pending_count || 0);
        } catch (_e) {}
      };

      fetchProfileChangeCount();
      fetchPendingUsersCount();

      const handleProfileUpdate = () => fetchProfileChangeCount();
      const handleUsersUpdate = () => fetchPendingUsersCount();

      window.addEventListener('profile_requests_updated', handleProfileUpdate);
      window.addEventListener('pending_users_updated', handleUsersUpdate);

      return () => {
        window.removeEventListener('profile_requests_updated', handleProfileUpdate);
        window.removeEventListener('pending_users_updated', handleUsersUpdate);
      };
    }
  }, [user?.role]);

  return (
    <>
      <div className={cn('fixed inset-0 z-30 bg-black/40 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} aria-hidden="true" />
      <aside className={cn('fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 border-r border-gray-200 bg-white px-4 py-6 transition-transform duration-200 lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900', open ? 'translate-x-0' : '-translate-x-full', 'lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]')}>
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Navigation</span>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close menu">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5">
          {items.map(({ to, label, icon: Icon, highlight }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? highlight
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : highlight
                    ? 'border border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
              onClick={onClose}
            >
              <div className="relative flex items-center">
                <Icon className="h-4 w-4" />
                {to === '/university/enrollments' && pendingWithdrawals > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {pendingWithdrawals > 9 ? '9+' : pendingWithdrawals}
                  </span>
                )}
                {to === '/admin/profile-change-requests' && pendingProfileChanges > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {pendingProfileChanges > 9 ? '9+' : pendingProfileChanges}
                  </span>
                )}
                {to === '/admin/users' && pendingUsers > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {pendingUsers > 9 ? '9+' : pendingUsers}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
