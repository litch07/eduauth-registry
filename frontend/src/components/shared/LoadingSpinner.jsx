export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 text-[var(--brand)] ${className}`} role="status" aria-label="Loading">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="text-sm font-medium">Loading</span>
    </div>
  );
}
