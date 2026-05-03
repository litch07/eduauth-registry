import { Menu, MoonStar, SunMedium, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { roleLabel } from '../../utils/helpers';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/25">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">EduAuth</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user ? roleLabel(user.role) : 'Public Access'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <span className="hidden text-sm text-gray-600 dark:text-gray-300 sm:block">
              {displayName}
            </span>
          ) : null}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
