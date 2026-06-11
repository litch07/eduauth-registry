import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

import NotificationDropdown from '../notifications/NotificationDropdown';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import Logo from '../shared/Logo';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef(null);

  useOutsideClick(userMenuRef, () => setOpenUserMenu(false));

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
    <header className="fixed top-0 left-0 right-0 z-40 h-[56px] bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <Link to={user ? `/${user.role}/dashboard` : "/"} className="flex items-center gap-2 group">
          <Logo className="h-7 w-auto" />
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-[var(--text-primary)] hidden sm:block">EduAuth</span>
            <span className="font-normal text-[var(--text-muted)] hidden md:block">Registry</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 h-full">
        <button
          onClick={toggleTheme}
          className="w-[36px] h-[36px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user && <NotificationDropdown />}

        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setOpenUserMenu(!openUserMenu)}
              className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[12px] font-medium transition-transform hover:scale-105"
            >
              {initials}
            </button>

            {openUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-[var(--border)]">
                  <p className="font-bold text-[var(--text-primary)] truncate">{displayName}</p>
                  <p className="text-xs text-[var(--text-muted)] capitalize truncate">{user.role}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setOpenUserMenu(false)}
                    className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setOpenUserMenu(false)}
                    className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  >
                    Settings
                  </Link>
                </div>
                <div className="border-t border-[var(--border)] py-1">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isLoggingOut ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing Out...
                      </>
                    ) : (
                      'Sign Out'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
