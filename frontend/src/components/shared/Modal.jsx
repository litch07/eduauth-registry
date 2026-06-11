import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/helpers';

export default function Modal({ isOpen, open, onClose, title, size = 'md', children, footer }) {
  const actualIsOpen = isOpen !== undefined ? isOpen : open;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Dialog open={actualIsOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className={cn(
          "w-full bg-[var(--bg-surface)] rounded-[16px] shadow-[var(--shadow-lg)] max-h-[90vh] flex flex-col relative",
          sizes[size]
        )}>
          {title && (
            <div className="flex items-center justify-between border-b border-[var(--border)] px-[24px] py-[20px]">
              <DialogTitle className="text-base font-semibold text-[var(--text-primary)] pr-8">
                {title}
              </DialogTitle>
            </div>
          )}
          
          <div className="absolute right-4 top-4 z-10">
            <Button variant="ghost" size="sm" onClick={onClose} className="!p-1 h-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="overflow-y-auto p-[24px]">
            {children}
          </div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-[var(--border)] px-[24px] py-[16px]">
              {footer}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
