import React, { useState } from 'react';
import { useLater } from '../context/LaterContext';
import {
  getPendingRecallItems,
  getMemoryMomentHeading,
  getMemoryMomentSubtext,
  getMemoryMomentWhyNow,
} from '../utils/reminderService';
import { getReschedulePresetOptions } from '../utils/rescheduleHelper';
import { PendingRecallModal } from './PendingRecallModal';
import {
  Play,
  Camera,
  MapPin,
  FileText,
  Phone,
  ExternalLink,
  ArrowRight,
  Clock,
  Sparkles,
  Calendar,
  Flame,
  Star,
  Leaf,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SystemState } from './ui/SystemState';

export const MemoryMoment: React.FC = () => {
  const { items, setSelectedItem, openItem, rescheduleItem } = useLater();
  const [showAllModal, setShowAllModal] = useState(false);
  const [activeSnoozeId, setActiveSnoozeId] = useState<string | null>(null);

  const pendingItems = getPendingRecallItems(items);
  const presetOptions = getReschedulePresetOptions();

  if (pendingItems.length === 0) {
    return (
      <div id="memory-moment-empty" className="w-full">
        <SystemState
          id="memory-moment-system-state"
          type="empty"
          icon={<Sparkles className="w-6 h-6 text-[var(--accent-gold)] stroke-[1.5]" />}
          title="Nothing to resurface yet."
          description="Items with scheduled reminders will resurface here when it's time."
          className="py-5 px-4 rounded-2xl"
        />
      </div>
    );
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-3 h-3 fill-current" />;
      case 'screenshot':
      case 'image':
        return <Camera className="w-3 h-3" />;
      case 'place':
        return <MapPin className="w-3 h-3" />;
      case 'person':
      case 'phone_number':
        return <Phone className="w-3 h-3" />;
      case 'link':
      case 'article':
      case 'product':
        return <ExternalLink className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const handleSelectPreset = (itemId: string, iso: string, e: React.MouseEvent) => {
    e.stopPropagation();
    rescheduleItem(itemId, iso);
    setActiveSnoozeId(null);
  };

  // Case 1: Single item surfaced
  if (pendingItems.length === 1) {
    const item = pendingItems[0];
    const heading = getMemoryMomentHeading(item);
    const subtext = getMemoryMomentSubtext(item);
    const isSnoozing = activeSnoozeId === item.id;
    const itemTag = item.urgencyTag || item.urgency;
    const tagCardClass =
      itemTag === 'urgent'
        ? 'card-tag-urgent'
        : itemTag === 'important'
        ? 'card-tag-important'
        : itemTag === 'chill'
        ? 'card-tag-chill'
        : '';

    return (
      <div id="memory-moment-card" className="w-full">
        <div className="rounded-2xl glass-elevated p-3 elevation-1 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[var(--divider)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--accent-gold)] text-xs select-none">✦</span>
              <span className="type-heading text-[var(--accent-gold)] font-semibold">
                From your memory
              </span>
            </div>
            <span className="type-caption text-[var(--text-tertiary)] text-[11px]">
              {subtext}
            </span>
          </div>

          {/* Context phrase */}
          {heading && (
            <div className="type-caption font-medium text-[var(--accent-gold)] mb-1.5 truncate">
              {heading}
            </div>
          )}

          {/* Single Item Row — Responsive layout preventing semantic badge clipping */}
          <div
            onClick={() => setSelectedItem(item)}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 px-3 rounded-xl glass-resting transition-colors cursor-pointer group min-h-[48px] ${tagCardClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shrink-0">
                {renderIcon(item.contentType || item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
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
                  <span className="type-body-sm font-medium text-[var(--text-primary)] truncate min-w-0 flex-1">
                    {item.title}
                  </span>
                </div>
                <p className="type-caption text-[var(--text-secondary)] text-[11px] truncate mt-0.5 leading-tight whitespace-nowrap block font-normal">
                  {getMemoryMomentWhyNow(item)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--divider)]/40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSnoozeId(isSnoozing ? null : item.id);
                }}
                className="type-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--surface-elevated)] flex items-center gap-1 cursor-pointer font-medium text-[11px] transition-colors border border-transparent hover:border-[var(--border)] min-h-[32px]"
              >
                <Clock className="w-3 h-3 text-[var(--accent)] shrink-0" />
                <span className="whitespace-nowrap">Not now</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.url) {
                    openItem(item.id);
                  } else {
                    setSelectedItem(item);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white type-caption font-semibold transition-opacity cursor-pointer flex items-center gap-1 shadow-2xs min-h-[32px]"
              >
                <span className="whitespace-nowrap">Open</span>
                <ArrowRight className="w-3 h-3 text-white shrink-0" />
              </button>
            </div>
          </div>

          {/* Snooze Presets Popover */}
          {isSnoozing && (
            <div className="mt-2 p-2 glass-schedule-sheet border border-[var(--border)] rounded-xl elevation-3 z-20 type-body-sm animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 type-caption text-[var(--text-secondary)] border-b border-[var(--divider)] font-medium">
                When should I bring this back?
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {presetOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={(e) => handleSelectPreset(item.id, opt.getIso(), e)}
                    className="w-full px-2 py-1 rounded-lg text-left text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] flex items-center justify-between cursor-pointer type-caption transition-colors"
                  >
                    <span>{opt.label}</span>
                    <span className="type-caption text-[var(--text-secondary)] text-[10px]">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                  setActiveSnoozeId(null);
                }}
                className="w-full mt-1 px-2 py-1 rounded-lg text-left text-[var(--accent)] hover:bg-[var(--surface-elevated)] border-t border-[var(--divider)] flex items-center justify-between font-semibold cursor-pointer type-caption transition-colors"
              >
                <span>Choose date & time</span>
                <Calendar className="w-3 h-3 text-[var(--accent)]" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Multiple items surfaced (>1) — show 2 items default for maximum vertical compactness
  const previewItems = pendingItems.slice(0, 2);

  return (
    <>
      <div id="memory-moment-multi-card" className="w-full">
        <div className="rounded-2xl glass-elevated p-3 elevation-1 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--divider)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--accent-gold)] text-xs select-none">✦</span>
              <span className="type-heading text-[var(--accent-gold)] font-semibold">
                From your memory
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              className="type-caption text-[#E8899C] dark:text-[var(--accent)] hover:underline transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
            >
              <span>See all ({pendingItems.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 2 preview items — single-line rows, height ~48px, vertical padding 8px (--space-2), gap 8px */}
          <div className="space-y-2">
            {previewItems.map((item) => {
              const itemTag = item.urgencyTag || item.urgency;
              const tagCardClass =
                itemTag === 'urgent'
                  ? 'card-tag-urgent'
                  : itemTag === 'important'
                  ? 'card-tag-important'
                  : itemTag === 'chill'
                  ? 'card-tag-chill'
                  : '';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`flex items-center justify-between gap-2.5 py-2 px-3 rounded-xl glass-resting transition-colors cursor-pointer group min-h-[48px] ${tagCardClass}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] shrink-0">
                      {renderIcon(item.contentType || item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
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
                            {itemTag === 'urgent' && <Flame className="w-2.5 h-2.5 shrink-0" />}
                            {itemTag === 'important' && <Star className="w-2.5 h-2.5 shrink-0" />}
                            {itemTag === 'chill' && <Leaf className="w-2.5 h-2.5 shrink-0" />}
                            <span className="whitespace-nowrap">{itemTag === 'urgent' ? 'Priority' : itemTag}</span>
                          </span>
                        )}
                        <span className="type-body-sm font-medium text-[var(--text-primary)] truncate min-w-0 flex-1">
                          {item.title}
                        </span>
                      </div>
                      <p className="type-caption text-[var(--text-secondary)] text-[11px] truncate mt-0.5 leading-tight whitespace-nowrap block font-normal">
                        {getMemoryMomentWhyNow(item)}
                      </p>
                    </div>
                  </div>

                  <div className="type-caption text-[var(--text-tertiary)] shrink-0 text-[11px] font-mono ml-2 whitespace-nowrap">
                    {getMemoryMomentSubtext(item)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal for full list */}
      <PendingRecallModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
      />
    </>
  );
};
