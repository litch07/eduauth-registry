import { Link } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import Card from './Card';

const colorMap = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 border-primary-100 dark:border-primary-900/50',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/50',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
  yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/50',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/50',
};

const borderHoverMap = {
  primary: 'hover:border-primary-500',
  green: 'hover:border-green-500',
  emerald: 'hover:border-emerald-500',
  blue: 'hover:border-blue-500',
  yellow: 'hover:border-amber-500',
  red: 'hover:border-red-500',
  orange: 'hover:border-orange-500',
};

export default function StatCard({ 
  icon, 
  label, 
  value, 
  color = 'primary', 
  to = '#', 
  tooltip = '',
  urgentCount = 0
}) {
  return (
    <Link 
      to={to}
      title={tooltip}
      className={cn(
        "block transition-all duration-200 ease-in-out",
        "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-xl"
      )}
    >
      <Card className={cn(
        "relative overflow-hidden border-2 transition-colors duration-200",
        "border-transparent dark:border-gray-800",
        borderHoverMap[color] || borderHoverMap.primary,
        "h-full"
      )}>
        {/* Urgent pulsing badge */}
        {urgentCount > 0 && (
          <span className="absolute top-3 right-3 flex h-3 w-3">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              color === 'red' || color === 'yellow' || color === 'orange' ? 'bg-red-400' : 'bg-primary-400'
            )}></span>
            <span className={cn(
              "relative inline-flex rounded-full h-3 w-3",
              color === 'red' || color === 'yellow' || color === 'orange' ? 'bg-red-500' : 'bg-primary-500'
            )}></span>
          </span>
        )}

        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:rotate-3 group-hover:scale-110",
            colorMap[color] || colorMap.primary
          )}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white truncate">
              {value}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
