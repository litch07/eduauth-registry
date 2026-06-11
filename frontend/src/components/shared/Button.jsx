import React from 'react';
import { cn } from '../../utils/helpers';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  icon,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-[8px] font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    primary: 'bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-hover)]',
    secondary: 'border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    danger: 'bg-[var(--danger)] text-[var(--text-inverse)] opacity-90 hover:opacity-100',
    success: 'bg-[var(--success)] text-[var(--text-inverse)] hover:bg-[var(--success-hover)]',
    info: 'bg-[var(--info)] text-[var(--text-inverse)] hover:bg-[var(--info-hover)]',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    link: 'text-[var(--brand)] underline-offset-4 hover:underline !p-0 !h-auto',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && icon && <span className="mr-1 inline-flex">{icon}</span>}
      {children}
    </button>
  );
}
