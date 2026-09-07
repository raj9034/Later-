import React, { useState } from 'react';
import { SavedItem, UrgencyTag } from '../../types';
import { CheckCircle2, Clock, Sparkles, Flame, Star, Leaf } from 'lucide-react';

export interface ResurfaceCardProps {
  item: SavedItem;
  reason?: string;
  whyNowExplanation?: string;
  isUrgent?: boolean;
  onOpen: (item: SavedItem) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  className?: string;
  staggerIndex?: number;
}

export const ResurfaceCard: React.FC<ResurfaceCardProps> = ({
  item,
  reason,
  whyNowExplanation,
  isUrgent = false,
  onOpen,
  onComplete,
  onSnooze,
  className = '',
  staggerIndex,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const itemTag: UrgencyTag | undefined = item.urgencyTag || item.urgency;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting) return;
    setIsCompleting(true);
    setTimeout(() => {
      onComplete(item.id);
    }, 350);
  };

  // Determine urgency tier for clear visual differentiation
  const isDueToday = Boolean(
    reason?.toLowerCase().startsWith('due') ||
    (isUrgent && (reason?.toLowerCase().includes('due') || reason?.toLowerCase().includes('today at')))
  );

  const unresolvedDaysMatch = reason?.match(/Unresolved for (\d+) days/i);
  const unresolvedDays = unresolvedDaysMatch ? parseInt(unresolvedDaysMatch[1], 10) : 0;
  const isUnresolvedLong = !isDueToday && unresolvedDays >= 7;

  // Urgency styling classes
  let urgencyCardClasses = 'hover:border-[var(--border)]';
  let statusTextClasses = 'text-[var(--text-secondary)] font-medium';
  let iconClasses = 'text-[var(--text-tertiary)]';

  if (itemTag === 'urgent') {
    urgencyCardClasses = 'card-tag-urgent';
    statusTextClasses = 'tag-text-urgent font-semibold';
    iconClasses = 'tag-text-urgent';
  } else if (itemTag === 'important') {
    urgencyCardClasses = 'card-tag-important';
    statusTextClasses = 'tag-text-important font-semibold';
    iconClasses = 'tag-text-important';
  } else if (itemTag === 'chill') {
    urgencyCardClasses = 'card-tag-chill';
    statusTextClasses = 'tag-text-chill font-semibold';
    iconClasses = 'tag-text-chill';
  } else if (isDueToday) {
    urgencyCardClasses = 'card-urgency-due-today';
    statusTextClasses = 'text-[var(--accent)] font-semibold';
    iconClasses = 'text-[var(--accent)]';
  } else if (isUnresolvedLong) {
    urgencyCardClasses = 'card-urgency-unresolved-long';
    statusTextClasses = 'text-[var(--warning)] font-semibold';
    iconClasses = 'text-[var(--warning)]';
  }

  const staggerDelay = staggerIndex !== undefined ? `${Math.min(staggerIndex * 40, 200)}ms` : undefined;

  return (
    <div
      id={`resurface-card-${item.id}`}
      style={{ animationDelay: staggerDelay }}
      className={`group relative px-[12px] py-[8px] rounded-xl glass-elevated transition-all duration-200 select-none elevation-1 ${urgencyCardClasses} ${
        isCompleting ? 'later-completing' : 'later-card-enter'
      } ${className}`}
    >
      {/* Top Tag / Reason - Ultra-compact header row tightly coupled with title */}
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {itemTag ? (
            <span
              className={`inline-flex items-center gap-1 uppercase text-[9px] font-mono px-1.5 py-0.5 rounded leading-none font-semibold shrink-0 whitespace-nowrap select-none ${
                itemTag === 'urgent'
                  ? 'tag-badge-urgent'
                  : itemTag === 'important'
                  ? 'tag-badge-important'
                  : 'tag-badge-chill'
              }`}
            >
              {itemTag === 'urgent' && <Flame className="w-2.5 h-2.5 shrink-0" />}
              {itemTag === 'important' && <Star className="w-2.5 h-2.5 shrink-0" />}
              {itemTag === 'chill' && <Leaf className="w-2.5 h-2.5 shrink-0" />}
              <span className="whitespace-nowrap">{itemTag === 'urgent' ? 'Priority' : itemTag}</span>
            </span>
          ) : (
            <Sparkles className={`w-3 h-3 shrink-0 ${iconClasses}`} />
          )}

          <span className={`type-caption font-body truncate text-[11px] leading-tight min-w-0 flex-1 ${statusTextClasses}`}>
            {reason || (itemTag === 'urgent' ? 'Priority item' : itemTag === 'important' ? 'Important item' : 'Suggested for right now')}
          </span>
        </div>

        {item.temporalType && !itemTag && (
          <span className="type-caption uppercase text-[var(--text-tertiary)] px-1 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[9px] font-mono leading-none shrink-0">
            {item.temporalType}
          </span>
        )}
      </div>

      {/* Main Content - Strict 1 line title + 1 line why now explanation */}
      <div className="cursor-pointer min-w-0" onClick={() => onOpen(item)}>
        <h4 className="text-[13px] font-semibold text-[var(--text-primary)] transition-colors truncate leading-snug">
          {item.title}
        </h4>
        {whyNowExplanation ? (
          <p className="type-caption text-[var(--text-secondary)] text-[11px] truncate mt-0.5 leading-tight whitespace-nowrap block font-normal">
            {whyNowExplanation}
          </p>
        ) : (item.summary || item.rawInput) ? (
          <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5 leading-tight overflow-hidden text-ellipsis whitespace-nowrap block">
            {item.summary || item.rawInput}
          </p>
        ) : null}
      </div>

      {/* Action Controls - 32px height buttons, strict 8px top margin */}
      <div className="flex items-center justify-between pt-1 mt-2 border-t border-[var(--divider)]">
        <button
          type="button"
          onClick={() => onSnooze(item.id)}
          className="inline-flex items-center gap-1 px-2.5 h-[32px] rounded-lg type-caption text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-resting-hover)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive"
        >
          <Clock className="w-3 h-3 shrink-0 text-[var(--text-tertiary)]" />
          <span>Not now</span>
        </button>

        <button
          type="button"
          onClick={handleComplete}
          className="inline-flex items-center gap-1.5 px-3 h-[32px] rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] type-caption text-[11px] font-semibold text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive shadow-2xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
