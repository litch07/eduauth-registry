import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Award,
  Mail,
  Key,
  UserPlus,
  Users,
  Search,
  UserSearch,
  Eye,
  List,
  BarChart3,
  Activity,
  Clock,
  LogOut,
} from 'lucide-react';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const menuItems = {
    STUDENT: [
      { label: 'Dashboard', path: '/student/dashboard', icon: Home },
      { label: 'My Certificates', path: '/student/certificates', icon: Award },
      { label: 'Certificate Requests', path: '/student/certificate-requests', icon: Mail },
      { label: 'Granted Access', path: '/student/granted-access', icon: Key },
    ],
    UNIVERSITY: [
      { label: 'Dashboard', path: '/university/dashboard', icon: Home },
      { label: 'Enroll Student', path: '/university/enroll-student', icon: UserPlus },
      { label: 'Issue Certificate', path: '/university/issue-certificate', icon: Award },
      { label: 'All Certificates', path: '/university/certificates', icon: List },
      { label: 'My Students', path: '/university/students', icon: Users },
    ],
    VERIFIER: [
      { label: 'Dashboard', path: '/verifier/dashboard', icon: Home },
      { label: 'Verify Certificate', path: '/verify', icon: Search },
      { label: 'Search Student', path: '/verifier/search', icon: UserSearch },
      { label: 'My Requests', path: '/verifier/requests', icon: Mail },
      { label: 'Active Access', path: '/verifier/access', icon: Key },
      { label: 'Verification History', path: '/verifier/verification-history', icon: Eye },
    ],
    ADMIN: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
      { label: 'Certificates', path: '/admin/certificates', icon: List },
      { label: 'Verifications', path: '/admin/verifications', icon: Eye },
      { label: 'Verification Analytics', path: '/admin/analytics', icon: BarChart3 },
      { label: 'Activity Logs', path: '/admin/logs', icon: Activity },
      { label: 'Pending Approvals', path: '/admin/pending-approvals', icon: Clock },
      { label: 'All Users', path: '/admin/users', icon: Users },
    ],
  };

  const items = menuItems[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 truncate">
          EduAuth Registry
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          Digital Certificate System
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition duration-200 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
        {/* User Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">
            {user.name || user.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
              {user.role}
            </span>
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg font-medium transition duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
