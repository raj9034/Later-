import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLater } from '../context/LaterContext';
import { ItemReminder, UrgencyTag } from '../types';
import { parseNaturalDateTime, formatDateTimeHint } from '../utils/naturalLanguageTime';
import {
  ArrowUp,
  Image as ImageIcon,
  Clipboard,
  X,
  Clock,
  Calendar,
  Sparkles,
  Check,
  RotateCcw,
  Flame,
  Star,
  Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UniversalCapture: React.FC = () => {
  const { saveItem, sharedPrefill, setSharedPrefill } = useLater();
  const [content, setContent] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [manualReminder, setManualReminder] = useState<ItemReminder | null>(null);
  const [ignoreDetectedTime, setIgnoreDetectedTime] = useState(false);
  const [selectedTag, setSelectedTag] = useState<UrgencyTag | null>(null);

  // Listen for incoming Android share sheet pre-fill
  useEffect(() => {
    if (!sharedPrefill) return;

    if (sharedPrefill.text !== undefined && sharedPrefill.text !== '') {
      setContent(sharedPrefill.text);
      setIgnoreDetectedTime(false);
    }
    if (sharedPrefill.image) {
      setAttachedImage(sharedPrefill.image);
    }

    setIsFocused(true);

    // Focus the textarea and bring the capture area into view smoothly
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    // Clear the prefill from context so user edits are not reverted
    setSharedPrefill(null);
  }, [sharedPrefill, setSharedPrefill]);

  // Custom Date/Time input state for the scheduler popover
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [customTime, setCustomTime] = useState('09:00');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Real-time natural language date/time parsing
  const detectedTime = useMemo(() => {
    if (!content.trim() || ignoreDetectedTime) return null;
    const res = parseNaturalDateTime(content);
    return res.hasExplicitTime ? res : null;
  }, [content, ignoreDetectedTime]);

  const handleSave = () => {
    const trimmed = content.trim();
    if (!trimmed && !attachedImage) return;

    let reminderToSave: ItemReminder | null | undefined = undefined;

    if (manualReminder) {
      reminderToSave = manualReminder;
    } else if (ignoreDetectedTime) {
      reminderToSave = {
        type: 'none',
        reminderStatus: 'waiting',
      };
    }

    try {
      saveItem(trimmed, attachedImage || undefined, reminderToSave, selectedTag || undefined);

      setContent('');
      setAttachedImage(null);
      setManualReminder(null);
      setIgnoreDetectedTime(false);
      setSelectedTag(null);
      setShowScheduler(false);
    } catch (err) {
      console.error('Save failed in UniversalCapture:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const clipboardItems = await navigator.clipboard.read().catch(() => null);
        if (clipboardItems) {
          for (const item of clipboardItems) {
            const imageType = item.types.find((t) => t.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) {
                  setAttachedImage(event.target.result as string);
                }
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }

        const text = await navigator.clipboard.readText();
        if (text) {
          setContent((prev) => (prev ? `${prev} ${text}` : text));
          setIgnoreDetectedTime(false);
        }
      }
    } catch {
      // Permission fallback
    }
  };

  // Preset Handlers
  const handleSelectPreset = (preset: 'later_today' | 'tonight' | 'tomorrow_morning' | 'tomorrow_evening' | 'this_weekend' | 'next_week') => {
    const now = new Date();
    const target = new Date();

    if (preset === 'later_today') {
      if (now.getHours() < 16) {
        target.setHours(17, 0, 0, 0); // 5:00 PM
      } else {
        target.setTime(now.getTime() + 3 * 60 * 60 * 1000); // in 3 hours
      }
    } else if (preset === 'tonight') {
      if (now.getHours() >= 20) {
        target.setTime(now.getTime() + 2 * 60 * 60 * 1000);
      } else {
        target.setHours(20, 30, 0, 0);
      }
    } else if (preset === 'tomorrow_morning') {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow_evening') {
      target.setDate(target.getDate() + 1);
      target.setHours(19, 0, 0, 0);
    } else if (preset === 'this_weekend') {
      const day = now.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + diff);
      target.setHours(10, 0, 0, 0);
    } else if (preset === 'next_week') {
      const day = now.getDay();
      const diff = (1 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + diff);
      target.setHours(9, 0, 0, 0);
    }

    setManualReminder({
      type: 'scheduled',
      scheduledAt: target.toISOString(),
      reminderStatus: 'waiting',
    });
    setIgnoreDetectedTime(false);
    setShowScheduler(false);
  };

  const handleApplyCustom = () => {
    if (!customDate || !customTime) return;
    const [year, month, day] = customDate.split('-').map(Number);
    const [hours, minutes] = customTime.split(':').map(Number);

    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    setManualReminder({
      type: 'scheduled',
      scheduledAt: targetDate.toISOString(),
      reminderStatus: 'waiting',
    });
    setIgnoreDetectedTime(false);
    setShowScheduler(false);
  };

  const handleClearReminder = () => {
    setManualReminder(null);
    setIgnoreDetectedTime(true);
    setShowScheduler(false);
  };

  const handleSelectFlexible = (period: 'later_today' | 'tomorrow' | 'weekend' | 'next_week') => {
    setManualReminder({
      type: 'flexible',
      flexiblePeriod: period,
      reminderStatus: 'waiting',
    });
    setIgnoreDetectedTime(false);
    setShowScheduler(false);
  };

  const openSchedulerWithPrefill = () => {
    const baseDate = manualReminder?.scheduledAt
      ? new Date(manualReminder.scheduledAt)
      : detectedTime?.scheduledAt
      ? new Date(detectedTime.scheduledAt)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
          return d;
        })();

    setCustomDate(
      `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(
        baseDate.getDate()
      ).padStart(2, '0')}`
    );
    setCustomTime(
      `${String(baseDate.getHours()).padStart(2, '0')}:${String(baseDate.getMinutes()).padStart(
        2,
        '0'
      )}`
    );
    setShowScheduler(true);
  };

  return (
    <div id="universal-capture-container" className="w-full relative">
      <div
        className={`relative rounded-3xl glass-elevated elevation-2 transition-all duration-150 ${
          isFocused
            ? 'border-[var(--accent)]/60 shadow-[0_8px_30px_rgba(232,137,156,0.2)] dark:shadow-[0_8px_32px_rgba(181,132,255,0.25)]'
            : 'hover:border-[var(--border)]'
        }`}
      >
        {/* Screenshot / Photo Attachment Preview */}
        {attachedImage && (
          <div className="p-4 pb-0 flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-sunken)]">
              <img
                src={attachedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              <button
                id="remove-attached-image-btn"
                type="button"
                onClick={() => setAttachedImage(null)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-black cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="type-body-sm text-[var(--text-secondary)]">
              <p className="text-[var(--text-primary)] font-medium">Screenshot attached</p>
              <p className="text-[var(--text-tertiary)]">Type a note or press remember</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <textarea
          id="universal-capture-textarea"
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (ignoreDetectedTime) setIgnoreDetectedTime(false);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What do you want me to remember?"
          rows={isFocused || content || attachedImage ? 2 : 1}
          className="w-full bg-transparent px-4 py-3.5 type-body text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none outline-none font-body leading-relaxed"
        />

        {/* Detected / Selected Time Indicator Banner */}
        {(manualReminder?.scheduledAt || manualReminder?.type === 'flexible' || detectedTime) && (
          <div className="px-4 pb-2.5 pt-0 flex items-center gap-2 flex-wrap">
            {manualReminder?.scheduledAt ? (
              <div
                id="manual-reminder-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--border)] text-[var(--accent)] type-caption font-mono"
              >
                <Clock className="w-3 h-3 text-[var(--accent)]" />
                <button
                  type="button"
                  onClick={openSchedulerWithPrefill}
                  className="hover:underline cursor-pointer font-medium"
                >
                  {formatDateTimeHint(new Date(manualReminder.scheduledAt))}
                </button>
                <button
                  id="clear-manual-reminder-btn"
                  type="button"
                  onClick={() => setManualReminder(null)}
                  className="p-0.5 rounded hover:bg-[var(--surface)] text-[var(--accent)] hover:text-[var(--text-primary)] cursor-pointer ml-1"
                  title="Remove manual schedule"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : manualReminder?.type === 'flexible' ? (
              <div
                id="manual-flexible-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-dashed border-[var(--border)] text-[var(--accent)] type-caption font-mono"
              >
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                <button
                  type="button"
                  onClick={openSchedulerWithPrefill}
                  className="hover:underline cursor-pointer font-medium"
                >
                  {manualReminder.flexiblePeriod === 'later_today'
                    ? 'Sometime today'
                    : manualReminder.flexiblePeriod === 'tomorrow'
                    ? 'Sometime this week'
                    : manualReminder.flexiblePeriod === 'weekend'
                    ? 'Sometime this weekend'
                    : 'Sometime next week'}
                </button>
                <button
                  id="clear-manual-flexible-btn"
                  type="button"
                  onClick={() => setManualReminder(null)}
                  className="p-0.5 rounded hover:bg-[var(--surface)] text-[var(--accent)] hover:text-[var(--text-primary)] cursor-pointer ml-1"
                  title="Remove flexible schedule"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : detectedTime ? (
              <div
                id="detected-reminder-badge"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] type-caption font-mono"
              >
                <Sparkles className="w-3 h-3 text-[var(--accent-gold)]" />
                <span>
                  {detectedTime.timeHint || 'Scheduled'}
                </span>
                <button
                  id="edit-detected-reminder-btn"
                  type="button"
                  onClick={openSchedulerWithPrefill}
                  className="ml-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  id="dismiss-detected-reminder-btn"
                  type="button"
                  onClick={() => setIgnoreDetectedTime(true)}
                  className="p-0.5 rounded hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer ml-1"
                  title="Don't set reminder"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Optional Urgency / Priority Tag Chips */}
        <div id="capture-priority-chips-group" className="flex items-center gap-1.5 px-4 pb-2.5 pt-0.5 select-none overflow-x-auto no-scrollbar">
          <span className="type-label text-[var(--text-tertiary)] mr-0.5 normal-case tracking-normal font-semibold text-[11px]">Priority</span>
          <button
            id="capture-tag-urgent-btn"
            type="button"
            onClick={() => setSelectedTag((prev) => (prev === 'urgent' ? null : 'urgent'))}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full type-tag transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border active:scale-[0.97] press-interactive ${
              selectedTag === 'urgent'
                ? 'chip-urgent-selected'
                : 'chip-urgent-resting'
            }`}
          >
            <Flame className="w-3 h-3 shrink-0" />
            <span>Priority</span>
          </button>
          <button
            id="capture-tag-important-btn"
            type="button"
            onClick={() => setSelectedTag((prev) => (prev === 'important' ? null : 'important'))}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full type-tag transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border active:scale-[0.97] press-interactive ${
              selectedTag === 'important'
                ? 'chip-important-selected'
                : 'chip-important-resting'
            }`}
          >
            <Star className="w-3 h-3 shrink-0" />
            <span>Important</span>
          </button>
          <button
            id="capture-tag-chill-btn"
            type="button"
            onClick={() => setSelectedTag((prev) => (prev === 'chill' ? null : 'chill'))}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full type-tag transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border active:scale-[0.97] press-interactive ${
              selectedTag === 'chill'
                ? 'chip-chill-selected'
                : 'chip-chill-resting'
            }`}
          >
            <Leaf className="w-3 h-3 shrink-0" />
            <span>Chill</span>
          </button>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-[var(--divider)]">
          <div className="flex items-center gap-2">
            {/* Attach Image / Screenshot */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              id="capture-screenshot-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer flex items-center gap-1.5 type-body-sm font-medium"
              title="Attach screenshot or photo"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Screenshot</span>
            </button>

            {/* Paste from clipboard */}
            <button
              id="capture-paste-btn"
              type="button"
              onClick={handlePasteClipboard}
              className="px-2.5 py-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer flex items-center gap-1.5 type-body-sm font-medium"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paste</span>
            </button>

            {/* Set Time Trigger Button */}
            <button
              id="capture-set-time-btn"
              type="button"
              onClick={openSchedulerWithPrefill}
              className={`px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 type-body-sm font-medium whitespace-nowrap shrink-0 ${
                manualReminder || detectedTime
                  ? 'text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
              }`}
              title="Set reminder time"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {manualReminder ? 'Change time' : 'Set time'}
              </span>
            </button>
          </div>

          {/* Save Action Button */}
          <button
            id="capture-save-btn"
            type="button"
            onClick={handleSave}
            disabled={!content.trim() && !attachedImage}
            className={`flex items-center justify-center px-4 py-2 rounded-xl type-button transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              content.trim() || attachedImage
                ? 'bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 font-semibold cursor-pointer shadow-xs active:scale-[0.97] press-interactive'
                : 'bg-[var(--surface-elevated)] text-[var(--text-tertiary)] cursor-not-allowed'
            }`}
          >
            <span className="whitespace-nowrap">Remember</span>
            <ArrowUp className="w-3.5 h-3.5 ml-1 shrink-0" />
          </button>
        </div>
      </div>

      {/* Scheduler Popover / Dropdown Modal */}
      <AnimatePresence>
        {showScheduler && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sheet-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-[24px] glass-schedule-sheet elevation-4 p-5 text-[var(--text-primary)] border border-[var(--border)]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Schedule Reminder</h3>
                </div>
                <button
                  id="close-scheduler-modal-btn"
                  type="button"
                  onClick={() => setShowScheduler(false)}
                  className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets Grid */}
              <div className="mt-3.5 space-y-1.5">
                <p className="text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">Quick Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="preset-later-today-btn"
                    type="button"
                    onClick={() => handleSelectPreset('later_today')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Later today</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">5:00 PM / +3h</p>
                  </button>

                  <button
                    id="preset-tonight-btn"
                    type="button"
                    onClick={() => handleSelectPreset('tonight')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Tonight</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">8:30 PM</p>
                  </button>

                  <button
                    id="preset-tomorrow-morning-btn"
                    type="button"
                    onClick={() => handleSelectPreset('tomorrow_morning')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Tomorrow morning</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">9:00 AM</p>
                  </button>

                  <button
                    id="preset-tomorrow-evening-btn"
                    type="button"
                    onClick={() => handleSelectPreset('tomorrow_evening')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Tomorrow evening</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">7:00 PM</p>
                  </button>

                  <button
                    id="preset-weekend-btn"
                    type="button"
                    onClick={() => handleSelectPreset('this_weekend')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">This weekend</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">Saturday 10:00 AM</p>
                  </button>

                  <button
                    id="preset-next-week-btn"
                    type="button"
                    onClick={() => handleSelectPreset('next_week')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Next week</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">Monday 9:00 AM</p>
                  </button>
                </div>
              </div>

              {/* Flexible / No Fixed Time */}
              <div className="mt-3.5 pt-3 border-t border-[var(--divider)] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                  <p className="text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">
                    Sometime (no fixed time)
                  </p>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] leading-snug pb-0.5">
                  No exact alarm — resurfaces naturally when it's relevant.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="flexible-later-today-btn"
                    type="button"
                    onClick={() => handleSelectFlexible('later_today')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99] border border-dashed border-[var(--border)]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Sometime today</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">No exact time</p>
                  </button>

                  <button
                    id="flexible-tomorrow-btn"
                    type="button"
                    onClick={() => handleSelectFlexible('tomorrow')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99] border border-dashed border-[var(--border)]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Sometime this week</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">No exact time</p>
                  </button>

                  <button
                    id="flexible-weekend-btn"
                    type="button"
                    onClick={() => handleSelectFlexible('weekend')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99] border border-dashed border-[var(--border)]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Sometime this weekend</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">No exact time</p>
                  </button>

                  <button
                    id="flexible-next-week-btn"
                    type="button"
                    onClick={() => handleSelectFlexible('next_week')}
                    className="p-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99] border border-dashed border-[var(--border)]"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)]">Sometime next week</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">No exact time</p>
                  </button>
                </div>
              </div>

              {/* Exact Date & Time Picker */}
              <div className="mt-4 pt-3 border-t border-[var(--divider)] space-y-2">
                <p className="text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">Exact Date & Time</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] block mb-1 font-medium">Date</label>
                    <input
                      id="custom-date-input"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] block mb-1 font-medium">Time</label>
                    <input
                      id="custom-time-input"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[var(--divider)] flex items-center justify-between gap-2">
                <button
                  id="clear-reminder-btn"
                  type="button"
                  onClick={handleClearReminder}
                  className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer flex items-center gap-1 border border-transparent hover:border-[var(--border)]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>No reminder</span>
                </button>

                <button
                  id="apply-custom-time-btn"
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  <span className="text-white">Set time</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
