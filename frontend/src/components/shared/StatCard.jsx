import React from 'react';
import Card from './Card';
import { cn } from '../../utils/helpers';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StatCard({ 
  title, 
  label, // for backward compatibility
  value, 
  icon, 
  trend, 
  trendValue, 
  variant = 'default', 
  color, // for backward compatibility
  loading = false,
  to = '#',
  tooltip = ''
}) {
  const actualTitle = title || label;
  const actualVariant = variant !== 'default' ? variant : (color || 'default');

  const iconColors = {
    default: 'bg-[var(--brand-light)] text-[var(--brand)]',
    primary: 'bg-[var(--brand-light)] text-[var(--brand)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    green: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    yellow: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger:  'bg-[var(--danger)]/10 text-[var(--danger)]',
    red:  'bg-[var(--danger)]/10 text-[var(--danger)]',
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--bg-elevated)]" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded bg-[var(--bg-elevated)]" />
            {trend && <div className="mt-2 h-3 w-12 animate-pulse rounded bg-[var(--bg-elevated)]" />}
          </div>
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
        </div>
      </Card>
    );
  }

  return (
    <Link to={to} title={tooltip} className="block transition-transform hover:-translate-y-1 hover:scale-[1.02]">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{actualTitle}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            {trend && trendValue && (
              <div className={cn(
                "mt-2 flex items-center text-xs font-medium",
                trend === 'up' ? "text-[var(--success)]" : "text-[var(--danger)]"
              )}>
                {trend === 'up' ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconColors[actualVariant] || iconColors.default)}>
              {icon}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
