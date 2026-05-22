export default function PurposeInput({ value, onChange, error, minLength = 20, maxLength = 500, placeholder = "Explain why you need access to the student's certificates..." }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Purpose
      </label>
      <textarea
        value={value}
        onChange={onChange}
        rows={5}
        maxLength={maxLength}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder={placeholder}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Minimum {minLength} characters, maximum {maxLength} characters.</span>
        <span>{value.length}/{maxLength}</span>
      </div>
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
