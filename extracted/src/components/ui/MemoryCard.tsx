import React, { useState } from 'react';
import { SavedItem } from '../../types';
import { Play, Camera, MapPin, CircleCheck as CheckCircle2, ExternalLink, Phone, FileText, Clock, Archive, Check, Timer, Flame, Star, Leaf } from 'lucide-react';
import { formatItemReminderLabel } from '../../utils/reminderService';
import { getAutoArchiveTimeRemaining } from '../../utils/autoArchiveService';

export interface MemoryCardProps {
  item: SavedItem;
  onClick?: () => void;
  onToggleDone?: (id: string) => void;
  onSnooze?: (id: string, option: 'tonight' | 'tomorrow' | 'this_weekend' | 'next_week') => void;
  onArchive?: (id: string) => void;
  className?: string;
  staggerIndex?: number;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  item,
  onClick,
  onToggleDone,
  onSnooze,
  onArchive,
  className = '',
  staggerIndex,
}) => {
  const [showQuickSnooze, setShowQuickSnooze] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleDone) return;
    if (!item.isDone) {
      if (isCompleting) return;
      setIsCompleting(true);
      setTimeout(() => {
        onToggleDone(item.id);
        setIsCompleting(false);
      }, 350);
    } else {
      onToggleDone(item.id);
    }
  };

  // Derive Type Icon with soft cloud / dark luxury tokens
  const renderTypeIcon = () => {
    if (item.imageAttachment) {
      return (
        <div className="w-8 h-8 rounded-lg overflow-hidden glass-icon-square shrink-0">
          <img src={item.imageAttachment} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }

    const type = item.contentType || item.type;

    switch (type) {
      case 'video':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Play className="w-3.5 h-3.5 fill-current" />
          </div>
        );
      case 'person':
      case 'phone_number':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
        );
      case 'place':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
        );
      case 'task':
      case 'event':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case 'link':
      case 'article':
      case 'product':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        );
      case 'screenshot':
      case 'image':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Camera className="w-3.5 h-3.5" />
          </div>
        );
      case 'note':
      case 'idea':
      default:
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const reminderText = formatItemReminderLabel(item);
  const itemTag = item.urgencyTag || item.urgency;

  const getTagCardClass = () => {
    if (itemTag === 'urgent') return 'card-tag-urgent';
    if (itemTag === 'important') return 'card-tag-important';
    if (itemTag === 'chill') return 'card-tag-chill';
    return '';
  };

  const staggerDelay = staggerIndex !== undefined ? `${Math.min(staggerIndex * 40, 200)}ms` : undefined;

  return (
    <div
      id={`memory-card-${item.id}`}
      onClick={onClick}
      style={{ animationDelay: staggerDelay }}
      className={`group relative flex items-center justify-between py-3.5 px-4 rounded-2xl glass-resting transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer select-none active:scale-[0.99] press-interactive ${getTagCardClass()} ${
        isCompleting ? 'later-completing' : 'later-card-enter'
      } ${
        item.isDone ? 'opacity-40 line-through' : ''
      } ${className}`}
    >
      {/* Left: Icon & Content */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        {renderTypeIcon()}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {itemTag && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full type-caption uppercase text-[9.5px] font-mono font-semibold shrink-0 whitespace-nowrap select-none ${
                  itemTag === 'urgent'
                    ? 'tag-badge-urgent'
                    : itemTag === 'important'
                    ? 'tag-badge-important'
                    : 'tag-badge-chill'
                }`}
              >
                {itemTag === 'urgent' && <Flame className="w-3 h-3 shrink-0" />}
                {itemTag === 'important' && <Star className="w-3 h-3 shrink-0" />}
                {itemTag === 'chill' && <Leaf className="w-3 h-3 shrink-0" />}
                <span className="whitespace-nowrap">{itemTag === 'urgent' ? 'Priority' : itemTag}</span>
              </span>
            )}
            <p className="type-body font-medium text-[var(--text-primary)] truncate min-w-0 flex-1 group-hover:text-[var(--text-primary)]">
              {item.title}
            </p>
            {item.intent && !itemTag && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full type-caption uppercase bg-[var(--surface-sunken)] text-[var(--text-tertiary)] border border-[var(--border)] shrink-0 whitespace-nowrap text-[10px] font-mono">
                {item.intent}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 type-caption text-[var(--text-tertiary)] truncate min-w-0">
            {item.isDone ? (
              <span className="flex items-center gap-1 text-[var(--success)] truncate">
                <Timer className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{getAutoArchiveTimeRemaining(item)?.label || 'Auto-archives in 24h'}</span>
              </span>
            ) : (
              <span className="truncate">
                {item.sourceDomain && <span className="text-[var(--text-secondary)]">{item.sourceDomain} · </span>}
                {item.extractedMeta?.phoneNumber && (
                  <span className="text-[var(--text-secondary)]">{item.extractedMeta.phoneNumber} · </span>
                )}
                <span className="text-[var(--text-secondary)]">{reminderText}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div
        className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toggle Done */}
        {onToggleDone && (
          <button
            type="button"
            onClick={handleToggleDone}
            className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.94] press-interactive ${
              item.isDone
                ? 'bg-[var(--success)]/15 border-[var(--success)]/40 text-[var(--success)]'
                : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--success)]/50 hover:text-[var(--success)] hover:bg-[var(--success)]/10'
            }`}
            title={item.isDone ? 'Mark undone' : 'Mark done'}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}

        {/* Quick Reschedule / Snooze */}
        {onSnooze && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickSnooze(!showQuickSnooze)}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.94] press-interactive"
              title="Remind me later"
            >
              <Clock className="w-4 h-4" />
            </button>

            {showQuickSnooze && (
              <div className="absolute right-0 top-8 w-36 glass-modal rounded-xl elevation-3 py-1 z-40 later-card-enter">
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(item.id, 'tonight');
                    setShowQuickSnooze(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer active:scale-[0.98]"
                >
                  Tonight
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(item.id, 'tomorrow');
                    setShowQuickSnooze(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer active:scale-[0.98]"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(item.id, 'this_weekend');
                    setShowQuickSnooze(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer active:scale-[0.98]"
                >
                  This weekend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(item.id, 'next_week');
                    setShowQuickSnooze(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer active:scale-[0.98]"
                >
                  Next week
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Archive */}
        {onArchive && (
          <button
            type="button"
            onClick={() => onArchive(item.id)}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--accent-gold)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
