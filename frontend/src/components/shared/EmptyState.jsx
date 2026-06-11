import React from 'react';
import { FileQuestion } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ icon: Icon = FileQuestion, title = "No data found", message, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-[48px] text-center">
      <Icon className="h-12 w-12 text-[var(--text-muted)]" />
      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {message && (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">{message}</p>
      )}
      {action && actionLabel && (
        <div className="mt-6">
          <Button variant="primary" onClick={action}>{actionLabel}</Button>
        </div>
      )}
      {action && !actionLabel && typeof action !== 'function' && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}
