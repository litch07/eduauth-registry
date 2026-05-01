import { cn } from '../../utils/helpers';

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}
