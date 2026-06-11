import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function SelectField({
  label,
  error,
  hint,
  description, // backward compatibility
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  required,
  className = '',
  isLoading = false,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const hasError = !!error;
  const actualHint = hint || description;
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
          {label} {required && <span className="text-[var(--danger)]">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-[40px] w-full items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] px-[12px] text-[14px] text-[var(--text-primary)] outline-none transition-all',
            hasError
              ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
              : 'focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
          )}
        >
          <span className={!selectedOption ? 'text-[var(--text-muted)]' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full overflow-y-auto rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]" style={{ maxHeight: '200px' }}>
            {isLoading ? (
              <div className="flex h-[36px] items-center px-[12px] text-[14px] text-[var(--text-muted)]">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="flex h-[36px] items-center px-[12px] text-[14px] text-[var(--text-muted)]">
                No options
              </div>
            ) : (
              <ul className="py-1 m-0 list-none p-0">
                {options.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => {
                      onChange?.(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex h-[36px] cursor-pointer items-center px-[12px] text-[14px] transition-colors',
                      String(opt.value) === String(value)
                        ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    )}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {hasError ? (
        <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>
      ) : actualHint ? (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{actualHint}</p>
      ) : null}
    </div>
  );
}
