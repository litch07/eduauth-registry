import React from 'react';
import PropTypes from 'prop-types';
import { XCircle } from 'lucide-react';

/**
 * ErrorAlert Component
 * Displays an error message with optional dismiss button
 * 
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {Function} props.onClose - Callback when dismiss button is clicked
 */
function ErrorAlert({ error, onClose }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-red-900 dark:text-red-100">Error</div>
          <div className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

ErrorAlert.propTypes = {
  error: PropTypes.string,
  onClose: PropTypes.func
};

export default ErrorAlert;
