import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed? This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  isDestructive = true,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:p-8 dark:bg-gray-900">
        <div className="absolute right-4 top-4">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-50 dark:hover:bg-gray-800"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sm:flex sm:items-start">
          <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDestructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse sm:gap-3">
          <Button 
            onClick={onConfirm} 
            variant={isDestructive ? "danger" : "primary"} 
            className="w-full sm:w-auto"
            loading={isLoading}
          >
            {confirmText}
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="mt-3 w-full sm:mt-0 sm:w-auto"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}
