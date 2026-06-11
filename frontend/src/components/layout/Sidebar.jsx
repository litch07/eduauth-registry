import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart, Layers, ShieldCheck, History, Settings, Award, UserCheck, Building2, FilePlus, FileSearch, FileEdit, ScrollText, User, LogOut, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';
import api from '../../services/api';

const navGroups = {
  student: [
    {
      label: 'MAIN',
      items: [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/certificates', label: 'My Certificates', icon: Award },
        { to: '/student/access-requests', label: 'Access Requests', icon: UserCheck },
        { to: '/student/my-university', label: 'My University', icon: Building2 },
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { to: '/profile', label: 'Profile', icon: User },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  university: [
    {
      label: 'MAIN',
      items: [
        { to: '/university/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/university/enrollments', label: 'Enrollments', icon: Users },
        { to: '/university/issue-certificate', label: 'Issue Certificate', icon: FilePlus },
        { to: '/university/certificates', label: 'Certificates', icon: Award },
      ]
    },
    {
      label: 'MANAGE',
      items: [
        { to: '/university/settings', label: 'Manage', icon: SlidersHorizontal },
      ]
    }
  ],
  verifier: [
    {
      label: 'MAIN',
      items: [
        { to: '/verifier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/verifier/verify-certificate', label: 'Verify Certificate', icon: ShieldCheck },
        { to: '/verifier/access-requests', label: 'Access Requests', icon: FileSearch },
        { to: '/verifier/verification-history', label: 'Verification History', icon: History },
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { to: '/profile', label: 'Profile', icon: User },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ],
  admin: [
    {
      label: 'MAIN',
      items: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/certificates', label: 'Certificates', icon: Award },
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart },
      ]
    },
    {
      label: 'MANAGE',
      items: [
        { to: '/admin/user-approvals', label: 'User Approvals', icon: UserCheck },
        { to: '/admin/profile-change-requests', label: 'Profile Requests', icon: FileEdit },
        { to: '/admin/activity-logs', label: 'Activity Logs', icon: ScrollText },
      ]
    }
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const groups = navGroups[user?.role] || [];
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [pendingProfileChanges, setPendingProfileChanges] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user?.role === 'university') {
      const fetchCount = async () => {
        try {
          const { data } = await api.get('/university/withdrawal/pending');
          setPendingWithdrawals(data.requests?.length || 0);
        } catch (e) { }
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
        } catch (_e) { }
      };

      const fetchPendingUsersCount = async () => {
        try {
          const { data } = await api.get('/admin/users', { params: { per_page: 1, status: 'pending' } });
          setPendingUsers(data.pending_count || 0);
        } catch (_e) { }
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  return (
    <>
      <div className={cn('fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')} onClick={onClose} aria-hidden="true" />
      <aside className={cn(
        'fixed left-0 top-[56px] z-40 h-[calc(100vh-56px)] w-[240px] border-r border-[var(--border)] bg-[var(--bg-surface)] flex flex-col transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex-1 overflow-y-auto py-2">
          {groups.map((group, i) => (
            <div key={i} className="mb-2">
              {groups.length > 1 && (
                <div className="px-5 pt-4 pb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {group.label}
                </div>
              )}
              <nav className="flex flex-col px-2 gap-[2px]">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 h-[36px] px-3 mx-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                    )}
                    onClick={onClose}
                  >
                    <div className="relative flex items-center">
                      <Icon className="w-4 h-4" />
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
                      {to === '/admin/user-approvals' && pendingUsers > 0 && (
                        <span className="absolute -top-1.5 -right-2 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                          {pendingUsers > 9 ? '9+' : pendingUsers}
                        </span>
                      )}
                    </div>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] p-3 shrink-0">
          <div className="flex items-center justify-between rounded-lg p-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[11px] font-medium">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "flex-shrink-0 p-1.5 rounded-md transition-colors",
                isLoggingOut ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              )}
              aria-label="Sign out"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
