import { cn } from '../../utils/helpers';

export default function ToggleSwitch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) {
  const toggleId = id || `toggle-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-3",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <div className="min-w-0 flex-1">
        {label && (
          <label
            htmlFor={toggleId}
            className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2",
          checked ? "bg-[var(--brand)]" : "bg-[var(--border-strong)]"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-[var(--bg-surface)] shadow-md ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
