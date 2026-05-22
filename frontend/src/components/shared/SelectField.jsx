import { cn } from '../../utils/helpers';

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  description,
  disabled = false,
  className = '',
  id,
}) {
  const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={cn("space-y-1", disabled && "opacity-50 pointer-events-none", className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-900 dark:text-white"
        >
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
          "shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
          "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-500",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
