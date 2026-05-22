import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, MoonStar, SunMedium, LogOut, ShieldCheck, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { roleLabel } from '../../utils/helpers';
import SearchBar from '../shared/SearchBar';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useOutsideClick } from '../../hooks/useOutsideClick';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useOutsideClick(userMenuRef, () => setOpenUserMenu(false));

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
          <Link to={user ? `/${user.role}/dashboard` : "/"} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/25 transition group-hover:shadow-lg group-hover:shadow-primary-600/30">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">EduAuth</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user ? roleLabel(user.role) : 'Public Access'}</p>
            </div>
          </Link>
        </div>

        <div className="hidden flex-1 px-8 lg:flex justify-center max-w-2xl">
          {user && <SearchBar />}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>

          {user && <NotificationDropdown />}

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setOpenUserMenu((current) => !current)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700 transition hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:ring-offset-gray-900"
                aria-label="User menu"
              >
                {/* Fallback to initial if no profile image is available */}
                <span className="text-sm font-bold uppercase">{displayName.charAt(0)}</span>
              </button>

              {openUserMenu ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                    <Link
                      to="/profile"
                      onClick={() => setOpenUserMenu(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Profile Details
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setOpenUserMenu(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Account Settings
                    </Link>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
