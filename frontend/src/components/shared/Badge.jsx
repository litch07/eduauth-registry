import React from 'react';
import { cn } from '../../utils/helpers';

export default function Badge({ children, variant = 'default', size = 'md', dot = false, className = '' }) {
  const variants = {
    default: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
    primary: 'bg-[var(--brand-light)] text-[var(--brand)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger:  'bg-[var(--danger)]/10 text-[var(--danger)]',
    info:    'bg-[var(--info)]/10 text-[var(--info)]',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1',
  };

  const dotColors = {
    default: 'bg-[var(--text-secondary)]',
    primary: 'bg-[var(--brand)]',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger:  'bg-[var(--danger)]',
    info:    'bg-[var(--info)]',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', variants[variant], sizes[size], className)}>
      {dot && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
