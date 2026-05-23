import React from 'react';
import { FileQuestion } from 'lucide-react';

export default function EmptyState({ title = "No data found", message, icon: Icon = FileQuestion, action }) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-200 border-dashed bg-white py-16 px-4 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {message && (
        <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
