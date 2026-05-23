import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorMessage({ message, retry }) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 py-12 px-4 text-center dark:border-red-900/20 dark:bg-red-900/10">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Failed to load data</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {message || "We couldn't load the information at this time. Please try again."}
      </p>
      {retry && (
        <Button onClick={retry} variant="outline" className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
