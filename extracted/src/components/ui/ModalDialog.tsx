import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
  id?: string;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  className = '',
  id,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div
      id={id ? `${id}-backdrop` : 'modal-dialog-backdrop'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sheet-backdrop animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        id={id}
        className={`w-full ${maxWidthClasses[maxWidth]} glass-modal border border-[var(--border)] rounded-[24px] elevation-4 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] shrink-0">
            <div>
              {title && (
                <h3 className="type-heading text-[var(--text-primary)]">{title}</h3>
              )}
              {subtitle && <p className="type-caption text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-[var(--text-primary)] font-body">{children}</div>
      </div>
    </div>
  );
};
