import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }[size];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className={`w-full ${widthClass} rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800`}>
          {title ? <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">{title}</DialogTitle> : null}
          <div className={title ? 'mt-4' : ''}>{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
