import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner Component
 * Displays an animated loading spinner with optional message
 * 
 * @param {Object} props
 * @param {string} props.message - Loading message to display
 * @param {string} props.className - Additional CSS classes
 */
function LoadingSpinner({ message = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
      {message && (
        <span className="ml-3 text-sm text-slate-600 dark:text-gray-300">
          {message}
        </span>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string
};

export default LoadingSpinner;
