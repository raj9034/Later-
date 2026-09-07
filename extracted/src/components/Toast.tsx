import React from 'react';
import { useLater } from '../context/LaterContext';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useLater();

  return (
    <AnimatePresence>
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full glass-modal border border-[var(--border)] text-xs font-medium font-body text-[var(--text-primary)] elevation-4 shadow-xl"
          >
            <div className="w-5 h-5 rounded-full bg-[var(--success)]/15 border border-[var(--success)]/30 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--success)] stroke-[2.5]" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
