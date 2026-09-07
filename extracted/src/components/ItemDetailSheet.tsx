import React, { useState, useEffect } from 'react';
import { useLater } from '../context/LaterContext';
import { formatItemReminderLabel, calculateFlexibleTarget, normalizeItemReminder } from '../utils/reminderService';
import { getAutoArchiveTimeRemaining } from '../utils/autoArchiveService';
import { SavedItem, FlexiblePeriod, ItemReminder, UrgencyTag } from '../types';
import { NotNowRescheduleMenu } from './NotNowRescheduleMenu';
import {
  X,
  ExternalLink,
  Phone,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  Play,
  Camera,
  MapPin,
  FileText,
  Check,
  Sparkles,
  ArrowRight,
  Timer,
  Sun,
  Moon,
  CalendarDays,
  CalendarRange,
  Calendar,
  Copy,
  Flame,
  Star,
  Leaf,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollIntoViewOnFocus } from '../utils/useScrollIntoViewOnFocus';

export const ItemDetailSheet: React.FC = () => {
  const {
    selectedItem,
    setSelectedItem,
    items,
    openItem,
    setReminderForItem,
    toggleDone,
    archiveItem,
    deleteItem,
    setItemUrgency,
    updateItemContent,
  } = useLater();

  const [showNotNowMenu, setShowNotNowMenu] = useState(false);
  const [showReminderEditor, setShowReminderEditor] = useState(false);
  const [editorTab, setEditorTab] = useState<'flexible' | 'specific' | 'none'>('flexible');
  const [customDateTime, setCustomDateTime] = useState('');
  const [copied, setCopied] = useState(false);

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const handleFocusScroll = useScrollIntoViewOnFocus();

  // Reset edit state when selected item changes
  useEffect(() => {
    if (selectedItem) {
      setEditTitle(selectedItem.title || '');
      setEditSummary(selectedItem.summary || '');
      setIsEditingContent(false);
      setIsCompleting(false);
    }
  }, [selectedItem?.id]);

  if (!selectedItem) return null;

  const item = selectedItem;
  const reminder = normalizeItemReminder(item);
  const reminderLabel = formatItemReminderLabel(item);
  const itemTag: UrgencyTag | undefined = item.urgencyTag || item.urgency;

  const handleToggleDone = () => {
    if (!item.isDone) {
      if (isCompleting) return;
      setIsCompleting(true);
      setTimeout(() => {
        toggleDone(item.id);
        setIsCompleting(false);
      }, 350);
    } else {
      toggleDone(item.id);
    }
  };

  const handleTagToggle = (tag: UrgencyTag) => {
    const nextTag = itemTag === tag ? null : tag;
    setItemUrgency(item.id, nextTag);
  };

  // Retrieve actual related memory objects
  const relatedMemories: SavedItem[] = (item.relatedMemoryIds || [])
    .map((id) => items.find((it) => it.id === id && !it.isArchived))
    .filter((it): it is SavedItem => Boolean(it))
    .slice(0, 3);

  const handleSetFlexible = (period: FlexiblePeriod) => {
    const target = calculateFlexibleTarget(period);
    setReminderForItem(item.id, {
      type: 'flexible',
      flexiblePeriod: period,
      scheduledAt: target.iso,
      reminderStatus: 'waiting',
    });
    setShowReminderEditor(false);
  };

  const handleSetSpecificPreset = (preset: 'today_evening' | 'tomorrow_morning' | 'tomorrow_evening') => {
    const d = new Date();
    if (preset === 'today_evening') {
      d.setHours(19, 0, 0, 0);
      if (d.getTime() <= Date.now()) {
        d.setHours(21, 0, 0, 0);
      }
    } else if (preset === 'tomorrow_morning') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow_evening') {
      d.setDate(d.getDate() + 1);
      d.setHours(19, 0, 0, 0);
    }

    setReminderForItem(item.id, {
      type: 'scheduled',
      scheduledAt: d.toISOString(),
      reminderStatus: 'waiting',
    });
    setShowReminderEditor(false);
  };

  const handleSetCustomTime = () => {
    if (!customDateTime) return;
    setReminderForItem(item.id, {
      type: 'scheduled',
      scheduledAt: new Date(customDateTime).toISOString(),
      reminderStatus: 'waiting',
    });
    setShowReminderEditor(false);
  };

  const handleRemoveReminder = () => {
    setReminderForItem(item.id, {
      type: 'none',
      reminderStatus: 'waiting',
    });
    setShowReminderEditor(false);
  };

  const renderTypeIcon = (type: string, isSmall = false) => {
    const size = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4';
    switch (type) {
      case 'video':
        return <Play className={`${size} fill-current`} />;
      case 'person':
      case 'phone_number':
        return <Phone className={size} />;
      case 'place':
        return <MapPin className={size} />;
      case 'task':
      case 'event':
        return <Check className={`${size} stroke-[2.5]`} />;
      case 'screenshot':
      case 'image':
        return <Camera className={size} />;
      case 'link':
      case 'article':
      case 'product':
        return <ExternalLink className={size} />;
      case 'note':
      case 'idea':
      default:
        return <FileText className={size} />;
    }
  };

  const handleStartEdit = () => {
    setEditTitle(item.title || '');
    setEditSummary(item.summary || '');
    setIsEditingContent(true);
  };

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();
    const finalTitle = trimmedTitle || item.title;
    updateItemContent(item.id, {
      title: finalTitle,
      summary: editSummary.trim(),
    });
    setIsEditingContent(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title || '');
    setEditSummary(item.summary || '');
    setIsEditingContent(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop - translucent scrim allowing ambient pink gradient to shine through in light mode */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          onClick={() => setSelectedItem(null)}
          className="absolute inset-0 sheet-backdrop"
        />

        {/* Sheet / Modal Container with 24px radius, pink glass in light mode, deep glass in dark mode */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }}
          exit={{ opacity: 0, y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          className="relative w-full max-w-lg glass-detail-sheet border-t sm:border border-[var(--border)] rounded-t-[24px] sm:rounded-[24px] elevation-3 z-10 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden text-[var(--text-primary)] font-body"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-[var(--divider)] shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl type-caption font-semibold bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center gap-1.5">
                {renderTypeIcon(item.contentType || item.type, true)}
                <span>{item.contentType || item.type}</span>
              </span>

              {item.intent && (
                <span className="px-2.5 py-1 rounded-xl type-caption font-semibold bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25">
                  {item.intent}
                </span>
              )}

              {itemTag && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl type-caption font-semibold uppercase text-[10px] font-mono shrink-0 whitespace-nowrap select-none ${
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

              {item.isDone && (
                <span className="px-2.5 py-1 rounded-xl type-caption font-semibold bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30">
                  Completed
                </span>
              )}
            </div>

            {/* Top-Right Action Area: "Not now" + Close "X" Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="detail-action-not-now-top"
                type="button"
                onClick={() => setShowNotNowMenu(!showNotNowMenu)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl type-caption text-[10.5px] font-medium transition-colors cursor-pointer border ${
                  reminder.reminderStatus === 'pending_recall' || showNotNowMenu
                    ? 'text-[var(--accent)] bg-[var(--surface-elevated)] border-[var(--border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border-transparent hover:border-[var(--border)]'
                }`}
                title="Reschedule / Not now"
              >
                <Clock className="w-3 h-3 text-[var(--accent)] shrink-0" />
                <span>Not now</span>
              </button>

              <button
                id="detail-sheet-close-btn"
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
            {/* Reschedule / Not Now Panel */}
            {showNotNowMenu && (
              <div className="p-3.5 rounded-2xl glass-schedule-sheet border border-[var(--border)] animate-in fade-in zoom-in-95">
                <NotNowRescheduleMenu
                  itemId={item.id}
                  itemTitle={item.title}
                  onClose={() => setShowNotNowMenu(false)}
                  onRescheduled={() => {
                    setShowNotNowMenu(false);
                  }}
                />
              </div>
            )}

            {/* Recalled Memory Notice - uses --accent-gold with glass treatment */}
            {reminder.reminderStatus === 'pending_recall' && (
              <div className="px-3.5 py-2.5 rounded-2xl glass-resting border border-[var(--accent-gold)]/35 flex items-center justify-between type-body-sm text-[var(--accent-gold)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                  <span className="text-[var(--text-primary)] font-semibold type-body-sm">Ready from your memory</span>
                </div>
                <span className="type-caption font-medium text-[var(--accent-gold)]">
                  Surfaced
                </span>
              </div>
            )}

            {/* Auto-archive Notice when marked Done */}
            {item.isDone && (
              <div className="px-3.5 py-2.5 rounded-2xl glass-resting border border-[var(--success)]/30 flex items-center justify-between type-body-sm text-[var(--success)]">
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                  <span className="text-[var(--text-primary)] type-body-sm">Auto-archives 24 hours after completion</span>
                </div>
                <span className="type-caption font-semibold text-[var(--success)]">
                  {getAutoArchiveTimeRemaining(item)?.label || 'Auto-archives in 24h'}
                </span>
              </div>
            )}

            {/* Attached Image / Screenshot */}
            {item.imageAttachment && (
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] glass-resting max-h-72 flex items-center justify-center p-1">
                <img
                  src={item.imageAttachment}
                  alt="Captured visual"
                  className="w-full h-auto object-contain max-h-72 rounded-xl"
                />
              </div>
            )}

            {/* Title, Summary & Metadata */}
            {isEditingContent ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="detail-edit-title-input"
                    className="type-caption text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block"
                  >
                    Title
                  </label>
                  <input
                    id="detail-edit-title-input"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onFocus={handleFocusScroll}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    placeholder="Title"
                    autoFocus
                    className="w-full px-3.5 py-2.5 input-glass-resting outline-none text-[var(--text-primary)] font-display text-[15px] font-semibold leading-snug"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="detail-edit-summary-input"
                    className="type-caption text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block"
                  >
                    Summary
                  </label>
                  <textarea
                    id="detail-edit-summary-input"
                    rows={3}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    onFocus={handleFocusScroll}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
                    placeholder="Summary (optional)"
                    className="w-full px-3.5 py-2.5 input-glass-resting outline-none text-[var(--text-secondary)] font-body text-[14px] leading-relaxed resize-none"
                  />
                </div>

                {/* Inline Save and Cancel buttons */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    id="detail-edit-save-btn"
                    type="button"
                    onClick={handleSaveEdit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 type-button text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                    <span>Save</span>
                  </button>
                  <button
                    id="detail-edit-cancel-btn"
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] type-button text-xs font-medium cursor-pointer transition-colors"
                  >
                    <span>Cancel</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 type-body-sm text-[var(--text-secondary)] pt-1">
                  {item.sourceDomain && (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)]">Source:</span>
                      <span className="text-[var(--text-primary)] font-medium">{item.sourceDomain}</span>
                    </span>
                  )}
                  {item.extractedMeta?.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)]">Phone:</span>
                      <span className="text-[var(--text-primary)] font-medium">{item.extractedMeta.phoneNumber}</span>
                    </span>
                  )}
                  {item.extractedMeta?.address && (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)]">Location:</span>
                      <span className="text-[var(--text-primary)] font-medium">{item.extractedMeta.address}</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2.5">
                  <h2 className="type-heading text-[var(--text-primary)] leading-snug flex-1">
                    {item.title}
                  </h2>
                  <button
                    id="detail-edit-toggle-btn"
                    type="button"
                    onClick={handleStartEdit}
                    className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer shrink-0"
                    title="Edit title & summary"
                    aria-label="Edit title and summary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.summary && item.summary !== item.title && (
                  <p className="type-body text-[var(--text-secondary)] leading-relaxed">
                    {item.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 type-body-sm text-[var(--text-secondary)] pt-1">
                  {item.sourceDomain && (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)]">Source:</span>
                      <span className="text-[var(--text-primary)] font-medium">{item.sourceDomain}</span>
                    </span>
                  )}
                  {item.extractedMeta?.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)]">Phone:</span>
                      <span className="text-[var(--text-primary)] font-medium">{item.extractedMeta.phoneNumber}</span>
                    </span>
                  )}
                  {item.extractedMeta?.address && (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-tertiary)]">Location:</span>
                      <span className="text-[var(--text-primary)] font-medium">{item.extractedMeta.address}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Original raw content box with glass card treatment */}
            {item.rawInput && item.rawInput !== item.title && (
              <div className="space-y-1.5">
                <div className="type-label text-[var(--text-secondary)]">Original input</div>
                <div className="p-3.5 rounded-2xl sheet-original-input type-body-sm text-[var(--text-secondary)] break-all leading-relaxed select-all">
                  {item.rawInput}
                </div>
              </div>
            )}

            {/* Urgency / Priority Tagging Control */}
            <div className="pt-3.5 border-t border-[var(--divider)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="type-label text-[var(--text-secondary)] font-medium">Priority</span>
                {itemTag ? (
                  <span className="type-caption text-[11px] text-[var(--text-tertiary)]">
                    Tap active tag to clear
                  </span>
                ) : (
                  <span className="type-caption text-[11px] text-[var(--text-tertiary)]">
                    Optional
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 select-none">
                <button
                  id="detail-tag-urgent-btn"
                  type="button"
                  onClick={() => handleTagToggle('urgent')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                    itemTag === 'urgent'
                      ? 'chip-urgent-selected'
                      : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] font-medium'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>Priority</span>
                </button>
                <button
                  id="detail-tag-important-btn"
                  type="button"
                  onClick={() => handleTagToggle('important')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                    itemTag === 'important'
                      ? 'chip-important-selected'
                      : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] font-medium'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 shrink-0" />
                  <span>Important</span>
                </button>
                <button
                  id="detail-tag-chill-btn"
                  type="button"
                  onClick={() => handleTagToggle('chill')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                    itemTag === 'chill'
                      ? 'chip-chill-selected'
                      : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] font-medium'
                  }`}
                >
                  <Leaf className="w-3.5 h-3.5 shrink-0" />
                  <span>Chill</span>
                </button>
              </div>
            </div>

            {/* Reminder Status & Management */}
            <div className="pt-3.5 border-t border-[var(--divider)] space-y-3">
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2 type-body-sm min-w-0 flex-1">
                  {reminder.reminderStatus === 'pending_recall' ? (
                    <span className="text-[var(--accent-gold)] shrink-0 font-bold">✦</span>
                  ) : reminder.type === 'none' ? (
                    <Sparkles className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  )}
                  <span
                    className={`truncate ${
                      reminder.reminderStatus === 'pending_recall'
                        ? 'text-[var(--accent-gold)] font-medium'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {reminderLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowReminderEditor(!showReminderEditor)}
                    className="type-body-sm text-[var(--accent)] hover:underline cursor-pointer font-semibold whitespace-nowrap"
                  >
                    {showReminderEditor ? 'Close' : 'Change reminder'}
                  </button>
                </div>
              </div>

              {/* Reminder Options Panel */}
              {showReminderEditor && (
                <div className="p-3.5 rounded-2xl glass-resting border border-[var(--border)] space-y-3 animate-in fade-in zoom-in-95">
                  {/* Mode tabs */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setEditorTab('flexible')}
                      className={`py-1.5 rounded-lg type-body-sm font-medium transition-all text-center cursor-pointer ${
                        editorTab === 'flexible'
                          ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Flexible
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('specific')}
                      className={`py-1.5 rounded-lg type-body-sm font-medium transition-all text-center cursor-pointer ${
                        editorTab === 'specific'
                          ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Specific
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('none')}
                      className={`py-1.5 rounded-lg type-body-sm font-medium transition-all text-center cursor-pointer ${
                        editorTab === 'none'
                          ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      No time
                    </button>
                  </div>

                  {editorTab === 'flexible' && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSetFlexible('later_today')}
                        className="px-3 py-2 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] text-left cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                      >
                        <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span>Later today</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetFlexible('tomorrow')}
                        className="px-3 py-2 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] text-left cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                      >
                        <Sun className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span>Tomorrow</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetFlexible('weekend')}
                        className="px-3 py-2 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] text-left cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span>This weekend</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetFlexible('next_week')}
                        className="px-3 py-2 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] text-left cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                      >
                        <CalendarRange className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span>Next week</span>
                      </button>
                    </div>
                  )}

                  {editorTab === 'specific' && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetSpecificPreset('today_evening')}
                          className="px-3 py-2 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] text-left cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                        >
                          <Moon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          <span>Today 7:00 PM</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetSpecificPreset('tomorrow_morning')}
                          className="px-3 py-2 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] text-left cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                        >
                          <Sun className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          <span>Tomorrow 9:00 AM</span>
                        </button>
                      </div>

                      <div className="pt-1.5 flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={customDateTime}
                          onChange={(e) => setCustomDateTime(e.target.value)}
                          className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 type-body-sm text-[var(--text-primary)] outline-none font-body"
                        />
                        <button
                          type="button"
                          onClick={handleSetCustomTime}
                          disabled={!customDateTime}
                          className="px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 type-button text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all active:scale-[0.98]"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  )}

                  {editorTab === 'none' && (
                    <div className="pt-1 space-y-2">
                      <p className="type-caption text-[var(--text-secondary)]">
                        Saves item in your Later memory without active reminder triggers.
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveReminder}
                        className="w-full py-2.5 px-3.5 rounded-xl schedule-preset-btn type-body-sm text-[var(--text-primary)] font-medium transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                        <span>Save in memory (No reminder)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connected / Related Memories with Glass Cards */}
            {relatedMemories.length > 0 && (
              <div className="pt-3.5 border-t border-[var(--divider)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="type-label text-[var(--text-secondary)]">
                    Related Memories
                  </span>
                  <span className="type-caption text-[var(--text-tertiary)]">
                    {relatedMemories.length} connected
                  </span>
                </div>

                <div className="space-y-2">
                  {relatedMemories.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setSelectedItem(rel)}
                      className="flex items-center justify-between p-3 rounded-2xl sheet-related-card cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="w-7 h-7 rounded-xl glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0 group-hover:text-[var(--text-primary)] transition-colors">
                          {renderTypeIcon(rel.contentType || rel.type, true)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="type-body-sm font-medium text-[var(--text-primary)] truncate">
                            {rel.title}
                          </p>
                          <p className="type-caption text-[var(--text-secondary)] truncate mt-0.5">
                            {formatItemReminderLabel(rel)}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Footer - safe area padded, transparent glass to allow pink gradient bleed */}
          <div className="p-4 sm:p-5 pt-3.5 border-t border-[var(--divider)] flex items-center justify-between gap-3 shrink-0 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
            {/* Primary & Secondary Actions — Unified Segmented Pill Control */}
            <div className="flex items-center flex-1 min-w-0">
              <div className="sheet-segmented-pill">
                {(item.url || item.extractedMeta?.phoneNumber || item.extractedMeta?.address) ? (
                  <>
                    <button
                      id="detail-action-open"
                      type="button"
                      onClick={() => openItem(item.id)}
                      className="sheet-segment-primary"
                    >
                      {item.extractedMeta?.phoneNumber ? (
                        <>
                          <Phone className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>Call {item.extractedMeta.personName || 'Contact'}</span>
                        </>
                      ) : item.extractedMeta?.address ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>Directions</span>
                        </>
                      ) : (
                        <>
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
                        </>
                      )}
                    </button>

                    <button
                      id="detail-action-done"
                      type="button"
                      onClick={handleToggleDone}
                      className={`sheet-segment-secondary ${isCompleting ? 'later-completing' : ''}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span>{item.isDone ? 'Mark undone' : 'Done'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      id="detail-action-done"
                      type="button"
                      onClick={handleToggleDone}
                      className={`sheet-segment-primary ${isCompleting ? 'later-completing' : ''}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{item.isDone ? 'Mark undone' : 'Done'}</span>
                    </button>

                    <button
                      id="detail-action-copy"
                      type="button"
                      onClick={() => {
                        const copyText = item.rawInput || item.summary || item.title;
                        if (copyText) {
                          navigator.clipboard.writeText(copyText);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="sheet-segment-secondary"
                      title="Copy content"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--accent)] stroke-[2.5] shrink-0" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Utility Actions (Archive, Delete) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                id="detail-action-archive"
                type="button"
                onClick={() => archiveItem(item.id)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface-elevated)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                id="detail-action-delete"
                type="button"
                onClick={() => deleteItem(item.id)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--destructive)] hover:bg-[var(--surface-elevated)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
