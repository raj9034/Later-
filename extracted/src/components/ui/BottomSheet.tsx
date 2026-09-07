import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footerAction?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  showHandle?: boolean;
  className?: string;
  id?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerAction,
  footerAction,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  showHandle = true,
  className = '',
  id = 'later-bottom-sheet',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={`${id}-container`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
            onClick={onClose}
            className="absolute inset-0 sheet-backdrop"
            aria-hidden="true"
          />

          {/* Sheet Surface with rounded-t-[24px] on mobile, rounded-[24px] on desktop */}
          <motion.div
            ref={sheetRef}
            id={id}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } }}
            exit={{ opacity: 0, y: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} glass-detail-sheet border-t sm:border border-[var(--border)] rounded-t-[24px] sm:rounded-[24px] elevation-4 z-10 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden text-[var(--text-primary)] font-body ${className}`}
          >
            {/* Pull / Dismiss Handle Bar for touch devices */}
            {showHandle && (
              <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-[var(--border)] opacity-80" />
              </div>
            )}

            {/* Sheet Header */}
            {(title || showCloseButton || headerAction) && (
              <div className="flex items-center justify-between px-5 sm:px-6 pt-3.5 pb-3 border-b border-[var(--divider)] shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <div className="truncate">
                    {typeof title === 'string' ? (
                      <h3 className="type-heading font-semibold text-[var(--text-primary)] truncate">
                        {title}
                      </h3>
                    ) : (
                      title
                    )}
                    {subtitle && (
                      typeof subtitle === 'string' ? (
                        <p className="type-caption text-[var(--text-secondary)] mt-0.5 truncate">
                          {subtitle}
                        </p>
                      ) : (
                        subtitle
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerAction}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)] focus-ring-later"
                      aria-label="Close sheet"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sheet Body Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {children}
            </div>

            {/* Sheet Footer Action Bar */}
            {footerAction && (
              <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--divider)] bg-[var(--surface-resting)]/50 shrink-0">
                {footerAction}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
