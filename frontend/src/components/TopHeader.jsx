import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';

function TopHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const dropdownRef = useRef(null);

  // Map routes to page titles
  const getPageTitle = () => {
    const route = location.pathname;

    // Student routes
    if (route === '/student/dashboard') return 'Dashboard';
    if (route === '/student/certificates') return 'My Certificates';
    if (route === '/student/certificate-requests') return 'Certificate Requests';
    if (route === '/student/granted-access') return 'Granted Access';
    if (route === '/student/profile') return 'Profile';

    // University routes
    if (route === '/university/dashboard') return 'Dashboard';
    if (route === '/university/enroll-student') return 'Enroll Student';
    if (route === '/university/issue-certificate') return 'Issue Certificate';
    if (route === '/university/certificates') return 'Issued Certificates';
    if (route === '/university/students') return 'My Students';
    if (route === '/university/profile') return 'Profile';

    // Verifier routes
    if (route === '/verifier/dashboard') return 'Dashboard';
    if (route === '/verify') return 'Verify Certificate';
    if (route === '/verifier/search') return 'Search Student';
    if (route === '/verifier/requests') return 'My Requests';
    if (route === '/verifier/access') return 'Active Access';
    if (route === '/verifier/verification-history') return 'Verification History';
    if (route === '/verifier/profile') return 'Profile';

    // Admin routes
    if (route === '/admin/dashboard') return 'Dashboard';
    if (route === '/admin/analytics') return 'Verification Analytics';
    if (route === '/admin/logs') return 'Activity Logs';
    if (route === '/admin/certificates') return 'Certificates';
    if (route === '/admin/verifications') return 'Verification Logs';
    if (route === '/admin/pending-approvals') return 'Pending Approvals';
    if (route === '/admin/users') return 'All Users';
    if (route === '/admin/profile') return 'Profile';

    return 'EduAuth Registry';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const handleProfileClick = () => {
    navigate(`/${user.role.toLowerCase()}/profile`);
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Section: Dark Mode Toggle & Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              {(user?.name || user?.email || '').split('@')[0]}
            </span>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
              {/* Profile Option */}
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition duration-150"
              >
                <User className="w-4 h-4" />
                View Profile
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-200 dark:border-gray-600"></div>

              {/* Logout Option */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition duration-150"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
