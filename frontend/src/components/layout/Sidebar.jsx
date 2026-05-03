import { NavLink } from 'react-router-dom';
import { BookOpen, LayoutDashboard, SquarePen, Users, XCircle, ScanSearch } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';

const navItems = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/certificates', label: 'Certificates', icon: BookOpen },
  ],
  university: [
    { to: '/university/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/university/issue-certificate', label: 'Issue Certificate', icon: SquarePen },
  ],
  verifier: [
    { to: '/verifier/dashboard', label: 'Dashboard', icon: ScanSearch },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/user-approvals', label: 'User Approvals', icon: Users },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = navItems[user?.role] || [];

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

        <nav className="space-y-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
              onClick={onClose}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
