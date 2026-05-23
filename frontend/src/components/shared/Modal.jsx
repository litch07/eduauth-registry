import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }[size];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 z-50">
        <DialogPanel className={`w-full ${widthClass} max-h-[90vh] md:max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-gray-800 relative flex flex-col`}>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          {title ? (
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-4 mb-2 sm:mb-4 border-b border-gray-100 dark:border-gray-700">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white pr-10">
                {title}
              </DialogTitle>
            </div>
          ) : null}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
