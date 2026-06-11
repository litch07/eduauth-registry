import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({ 
  isOpen, 
  open, // backward compatibility
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed? This action cannot be undone.", 
  confirmLabel,
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  confirmVariant,
  isDestructive = true,
  loading,
  isLoading = false
}) {
  const actualIsOpen = isOpen !== undefined ? isOpen : open;
  const actualLoading = loading !== undefined ? loading : isLoading;
  const actualConfirmLabel = confirmLabel || confirmText;
  const actualConfirmVariant = confirmVariant || (isDestructive ? 'danger' : 'primary');

  return (
    <Modal isOpen={actualIsOpen} onClose={actualLoading ? undefined : onClose} size="sm">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${actualConfirmVariant === 'danger' ? 'bg-[var(--danger)]/10' : 'bg-[var(--brand-light)]'}`}>
          <AlertTriangle className={`h-6 w-6 ${actualConfirmVariant === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--brand)]'}`} />
        </div>
        <div className="mt-3 sm:ml-4 sm:mt-0">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-8 sm:flex-row sm:justify-end">
        <Button 
          onClick={onClose} 
          variant="secondary" 
          disabled={actualLoading}
          className="w-full sm:w-auto"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant={actualConfirmVariant} 
          loading={actualLoading}
          className="w-full sm:w-auto"
        >
          {actualConfirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
