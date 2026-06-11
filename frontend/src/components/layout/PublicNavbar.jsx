import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';
import Logo from '../shared/Logo';

export default function PublicNavbar() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 left-0 right-0 z-40 h-[56px] bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link to={user ? `/${user.role}/dashboard` : "/"} className="flex items-center gap-2 group">
        <Logo className="h-7 w-auto" />
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-[var(--text-primary)]">EduAuth</span>
          <span className="font-normal text-[var(--text-muted)] hidden sm:block">Registry</span>
        </div>
      </Link>

      <div className="flex items-center gap-2 h-full">
        <Link
          to="/verify"
          className={cn(
            'hidden sm:inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition',
            isActive('/verify')
              ? 'text-[var(--brand)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          )}
        >
          Verify
        </Link>
        <button
          onClick={toggleTheme}
          className="w-[36px] h-[36px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <Link
          to="/login"
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            isActive('/login')
              ? 'text-[var(--brand)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          )}
        >
          Login
        </Link>
        <Link
          to="/register"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-hover)]"
        >
          Register
        </Link>
      </div>
    </header>
  );
}
