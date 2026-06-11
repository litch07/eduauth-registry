import React from 'react';
import { cn } from '../../utils/helpers';

export default function Card({ children, className = '', padding = '20px', shadow = 'shadow-card', border = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] rounded-xl',
        border && 'border border-[var(--border)]',
        shadow,
        className
      )}
      style={{ padding }}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ className = '', children, ...props }) {
  return <div className={cn('mb-4', className)} {...props}>{children}</div>;
};

Card.Body = function CardBody({ className = '', children, ...props }) {
  return <div className={className} {...props}>{children}</div>;
};

Card.Footer = function CardFooter({ className = '', children, ...props }) {
  return <div className={cn('mt-4 pt-4 border-t border-[var(--border)]', className)} {...props}>{children}</div>;
};
