import React from 'react';
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Inbox, Search, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export type SystemStateType =
  | 'loading'
  | 'empty'
  | 'empty_memories'
  | 'empty_search'
  | 'empty_priority'
  | 'empty_category'
  | 'error'
  | 'success'
  | 'completed';

export interface SystemStateProps {
  type: SystemStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Reusable system state component providing unified visual feedback for:
 * Loading, Empty (memories, search, priority, category), Error with retry, and Success.
 */
export const SystemState: React.FC<SystemStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
  id,
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />,
          title: title || 'Loading your memories…',
          description: description || 'Quietly retrieving your saved items.',
          actionText: actionLabel,
        };
      case 'empty_search':
        return {
          icon: icon || <Search className="w-7 h-7 text-[var(--text-tertiary)] stroke-[1.5]" />,
          title: title || 'No memories found',
          description: description || 'Try searching with different keywords or date ranges.',
          actionText: actionLabel || (onAction ? 'Clear search' : undefined),
        };
      case 'empty_priority':
        return {
          icon: icon || <Sparkles className="w-7 h-7 text-[var(--accent-gold)] stroke-[1.5]" />,
          title: title || 'Nothing urgent right now',
          description: description || 'Your priority queue is clear. Relax or browse your memory bank.',
          actionText: actionLabel,
        };
      case 'empty_category':
        return {
          icon: icon || <FolderOpen className="w-7 h-7 text-[var(--text-tertiary)] stroke-[1.5]" />,
          title: title || 'This category is clear',
          description: description || 'Items matching this category will appear here.',
          actionText: actionLabel,
        };
      case 'empty_memories':
      case 'empty':
        return {
          icon: icon || <Inbox className="w-8 h-8 text-[var(--text-tertiary)] stroke-[1.5]" />,
          title: title || 'Your memory bank is clear',
          description: description || 'Capture links, notes, screenshots, or tasks to keep them for later.',
          actionText: actionLabel,
        };
      case 'error':
        return {
          icon: icon || <AlertCircle className="w-7 h-7 text-[var(--destructive)] stroke-[1.5]" />,
          title: title || 'Something interrupted this action',
          description: description || 'Your data is safe. Please retry or refresh.',
          actionText: actionLabel || 'Try again',
        };
      case 'success':
        return {
          icon: icon || <CheckCircle2 className="w-7 h-7 text-[var(--success)] stroke-[1.5]" />,
          title: title || 'Saved for Later',
          description: description || 'Safely organized in your external memory.',
          actionText: actionLabel,
        };
      case 'completed':
        return {
          icon: icon || <Sparkles className="w-7 h-7 text-[var(--accent-gold)] stroke-[1.5]" />,
          title: title || 'All dealt with',
          description: description || 'No priority items requiring your attention right now.',
          actionText: actionLabel,
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-2xl bg-[var(--surface-resting)] border border-[var(--border)] elevation-1 transition-all ${
        type === 'loading' ? 'later-skeleton' : ''
      } ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center mb-3.5 shadow-xs">
        {content.icon}
      </div>
      <h3 className="type-heading text-[var(--text-primary)] font-medium mb-1">
        {content.title}
      </h3>
      <p className="type-caption text-[var(--text-secondary)] max-w-xs leading-relaxed">
        {content.description}
      </p>
      {content.actionText && onAction && (
        <div className="mt-4">
          <Button
            size="sm"
            variant={type === 'error' ? 'secondary' : 'primary'}
            leftIcon={type === 'error' ? <RefreshCw className="w-3 h-3" /> : undefined}
            onClick={onAction}
          >
            {content.actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
