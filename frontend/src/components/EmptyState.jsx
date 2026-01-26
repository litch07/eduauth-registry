import React from 'react';
import PropTypes from 'prop-types';

/**
 * EmptyState Component
 * Displays a placeholder when no data is available
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide icon component to display
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {React.ReactNode} props.action - Action button or link
 */
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center shadow-sm">
      {Icon && <Icon className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-gray-500" />}
      {title && <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>}
      {description && (
        <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node
};

export default EmptyState;
