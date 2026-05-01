export default function Input({ label, className = '', id, ...props }) {
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
        className="input-field"
        {...props}
      />
    </div>
  );
}
