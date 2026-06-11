export default function Logo({ className = "w-8 h-8", invert = false }) {
  const baseClasses = `shrink-0 ${className}`;
  
  // When invert is true (e.g., on a brand-colored background):
  // Shapes become white, checkmark becomes brand color to show through.
  // Otherwise, shapes are brand color, checkmark is white.
  
  const shapeClass = invert ? "text-white" : "text-[var(--brand)] dark:text-white";
  const checkClass = invert ? "text-[var(--brand)]" : "text-white dark:text-[var(--bg-surface)]";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className={baseClasses}>
      {/* Mortarboard / Graduation Cap Top */}
      <path fill="currentColor" className={shapeClass} d="M 60 10 L 110 30 L 60 50 L 10 30 Z" />
                 
      {/* Shield Body */}
      <path fill="currentColor" className={shapeClass} d="M 20 43 L 60 59 L 100 43 L 100 70 C 100 95, 75 107, 60 110 C 45 107, 20 95, 20 70 Z" />

      {/* Verification Checkmark */}
      <path fill="none" stroke="currentColor" className={checkClass} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" d="M 44 77 L 54 87 L 76 63" />
    </svg>
  );
}
