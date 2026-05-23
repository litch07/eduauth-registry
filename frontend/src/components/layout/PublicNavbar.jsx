import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';

export default function PublicNavbar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={user ? `/${user.role}/dashboard` : "/"} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/25 transition group-hover:shadow-lg group-hover:shadow-primary-600/30">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">EduAuth</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/verify"
            className={cn(
              'hidden sm:inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive('/verify')
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            Verify
          </Link>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <Link
            to="/login"
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive('/login')
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 hover:shadow"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
