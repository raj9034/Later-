import React, { useState } from 'react';
import { useLater } from '../context/LaterContext';
import { SavedItem } from '../types';
import {
  getPendingRecallItems,
  getMemoryMomentHeading,
  getMemoryMomentSubtext,
  getMemoryMomentWhyNow,
} from '../utils/reminderService';
import { getReschedulePresetOptions } from '../utils/rescheduleHelper';
import {
  X,
  Sparkles,
  ExternalLink,
  Play,
  Camera,
  MapPin,
  FileText,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  Flame,
  Star,
  Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PendingRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PendingRecallModal: React.FC<PendingRecallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { items, setSelectedItem, openItem, toggleDone, rescheduleItem } = useLater();
  const [reschedulingItemId, setReschedulingItemId] = useState<string | null>(null);

  const pendingItems = getPendingRecallItems(items);
  const presetOptions = getReschedulePresetOptions();

  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-3.5 h-3.5 fill-current" />;
      case 'screenshot':
      case 'image':
        return <Camera className="w-3.5 h-3.5" />;
      case 'place':
        return <MapPin className="w-3.5 h-3.5" />;
      case 'person':
      case 'phone_number':
        return <Phone className="w-3.5 h-3.5" />;
      case 'link':
      case 'article':
      case 'product':
        return <ExternalLink className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const handleSelectPreset = (itemId: string, iso: string) => {
    rescheduleItem(itemId, iso);
    setReschedulingItemId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          onClick={onClose}
          className="absolute inset-0 sheet-backdrop"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }}
          exit={{ opacity: 0, y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          className="relative w-full max-w-lg glass-detail-sheet border-t sm:border border-[var(--border)] rounded-t-[24px] sm:rounded-[24px] p-5 sm:p-6 elevation-3 z-10 max-h-[85vh] flex flex-col text-[var(--text-primary)] font-body"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent-gold)] text-xs">✦</span>
              <h3 className="type-heading-lg text-[var(--accent-gold)]">
                From Your Memory
              </h3>
              <span className="type-caption text-[var(--text-tertiary)]">
                ({pendingItems.length})
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="type-body-sm text-[var(--text-secondary)] my-3 shrink-0">
            Items you wanted to remember that have resurfaced. Take a look or postpone for later.
          </p>

          {/* List of Surfaced Items */}
          <div className="overflow-y-auto space-y-2.5 flex-1 pr-0.5 py-1">
            {pendingItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                All memories are resting peacefully.
              </div>
            ) : (
              pendingItems.map((item) => {
                const heading = getMemoryMomentHeading(item);
                const subtext = getMemoryMomentSubtext(item);
                const isPickingReschedule = reschedulingItemId === item.id;
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
                    className={`p-3.5 rounded-2xl sheet-related-card flex flex-col gap-2.5 ${tagCardClass}`}
                  >
                    {/* Top row: heading, tag and type */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
                        <span className="text-[11px] font-medium text-[var(--accent-gold)] font-sans truncate min-w-0">
                          {heading}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0 whitespace-nowrap">
                        {subtext}
                      </span>
                    </div>

                    {/* Main content click opens detail */}
                    <div
                      onClick={() => {
                        setSelectedItem(item);
                        onClose();
                      }}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0 mt-0.5 group-hover:text-[var(--text-primary)]">
                        {renderIcon(item.contentType || item.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="type-caption text-[var(--text-secondary)] text-[11px] truncate mt-0.5 leading-tight whitespace-nowrap block font-normal">
                          {getMemoryMomentWhyNow(item)}
                        </p>
                        {item.summary && item.summary !== item.title && (
                          <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--divider)] mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.url) {
                              openItem(item.id);
                            } else {
                              setSelectedItem(item);
                              onClose();
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-[0.98]"
                        >
                          <span className="text-white">Open</span>
                          <ArrowRight className="w-3 h-3 text-white" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleDone(item.id)}
                          className="px-3 py-1.5 rounded-xl hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--success)] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[var(--border)]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>
                      </div>

                      {/* Not now / Reschedule toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setReschedulingItemId(isPickingReschedule ? null : item.id)
                          }
                          className="px-2.5 py-1.5 rounded-xl hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[var(--border)]"
                        >
                          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>Not now</span>
                        </button>

                        {/* Quick Reschedule Options */}
                        {isPickingReschedule && (
                          <div className="absolute right-0 bottom-full mb-1.5 w-52 glass-schedule-sheet border border-[var(--border)] rounded-2xl elevation-3 py-1.5 z-20 text-xs font-mono">
                            <div className="px-3 py-1 text-[10px] text-[var(--text-secondary)] border-b border-[var(--divider)] font-sans font-medium">
                              When should I bring this back?
                            </div>
                            {presetOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => handleSelectPreset(item.id, opt.getIso())}
                                className="w-full px-3 py-1.5 text-left text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] flex items-center justify-between transition-colors"
                              >
                                <span>{opt.label}</span>
                                <span className="text-[10px] text-[var(--text-secondary)]">{opt.sublabel}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setReschedulingItemId(null);
                                onClose();
                              }}
                              className="w-full px-3 py-1.5 text-left text-[var(--accent)] hover:bg-[var(--surface-elevated)] border-t border-[var(--divider)] flex items-center justify-between font-semibold transition-colors"
                            >
                              <span>Choose date & time</span>
                              <Calendar className="w-3 h-3 text-[var(--accent)]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-[var(--divider)] text-center shrink-0">
            <button
              onClick={onClose}
              className="text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
