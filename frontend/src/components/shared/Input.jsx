export default function Input({ label, className = '', id, error, ...props }) {
  const inputId = id || props.name;

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`input-field ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
