import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';

/**
 * PageHeader Component
 * 
 * Provides a consistent, reusable header for all pages with navigation controls.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Page title (required)
 * @param {boolean} [props.showBack=true] - Show back button
 * @param {string} [props.backTo] - Custom back path (defaults to role-based dashboard)
 * @param {boolean} [props.showHome=true] - Show home icon
 * @param {React.ReactNode} [props.actions] - Custom action buttons
 * 
 * @example
 * // Basic usage
 * <PageHeader title="View Certificate" />
 * 
 * @example
 * // With custom actions
 * <PageHeader 
 *   title="Manage Enrollments"
 *   actions={<button>Add Student</button>}
 * />
 */
function PageHeader({ title, showBack = true, backTo, showHome = true, actions }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Auto-detect dashboard based on role
  const getDashboardPath = () => {
    if (backTo) return backTo;
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT': return '/student/dashboard';
      case 'UNIVERSITY': return '/university/dashboard';
      case 'VERIFIER': return '/verifier/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/';
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Back + Title */}
          <div className="flex items-center space-x-4">
            {showBack && (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
          </div>
          
          {/* Right side: Actions + Dark Mode + Home */}
          <div className="flex items-center space-x-2">
            {actions}
            <DarkModeToggle />
            {showHome && (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Go to dashboard"
              >
                <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
