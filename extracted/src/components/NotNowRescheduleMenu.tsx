import React, { useState } from 'react';
import { useLater } from '../context/LaterContext';
import {
  getReschedulePresetOptions,
  getDefaultDatetimeLocalString,
  ReschedulePresetOption,
} from '../utils/rescheduleHelper';
import {
  Clock,
  Sun,
  Moon,
  CalendarDays,
  CalendarRange,
  Calendar,
  X,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotNowRescheduleMenuProps {
  itemId: string;
  itemTitle?: string;
  onClose: () => void;
  onRescheduled?: () => void;
}

export const NotNowRescheduleMenu: React.FC<NotNowRescheduleMenuProps> = ({
  itemId,
  itemTitle,
  onClose,
  onRescheduled,
}) => {
  const { rescheduleItem } = useLater();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDateTime, setCustomDateTime] = useState(() => getDefaultDatetimeLocalString(2));

  const presetOptions = getReschedulePresetOptions();

  const handleSelectPreset = (preset: ReschedulePresetOption) => {
    const iso = preset.getIso();
    rescheduleItem(itemId, iso);
    if (onRescheduled) {
      onRescheduled();
    }
    onClose();
  };

  const handleConfirmCustom = () => {
    if (!customDateTime) return;
    const iso = new Date(customDateTime).toISOString();
    rescheduleItem(itemId, iso);
    if (onRescheduled) {
      onRescheduled();
    }
    onClose();
  };

  const renderPresetIcon = (id: string) => {
    switch (id) {
      case 'in_10_minutes':
        return <Clock className="w-4 h-4 text-[var(--accent)]" />;
      case 'in_1_hour':
        return <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />;
      case 'tonight':
        return <Moon className="w-4 h-4 text-[var(--text-tertiary)]" />;
      case 'tomorrow':
        return <Sun className="w-4 h-4 text-[var(--accent)]" />;
      case 'this_weekend':
        return <CalendarDays className="w-4 h-4 text-[var(--success)]" />;
      case 'next_week':
        return <CalendarRange className="w-4 h-4 text-[var(--text-tertiary)]" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />;
    }
  };

  return (
    <div
      id="not-now-reschedule-menu"
      className="p-4 rounded-2xl glass-resting border border-[var(--border)] elevation-2 text-left space-y-3 text-[var(--text-primary)] font-body animate-in fade-in zoom-in-95"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--divider)]">
        <div>
          <span className="type-caption text-[var(--accent-gold)] font-semibold uppercase tracking-wider">
            Not now
          </span>
          <h3 className="type-heading text-[var(--text-primary)]">
            When should I bring this back?
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
          title="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!showCustomPicker ? (
        <div className="space-y-1.5">
          {presetOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectPreset(opt)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                {renderPresetIcon(opt.id)}
                <span className="type-body-sm font-medium text-[var(--text-primary)]">
                  {opt.label}
                </span>
              </div>
              <span className="type-caption text-[var(--text-secondary)]">
                {opt.sublabel}
              </span>
            </button>
          ))}

          {/* Option 7: Choose date & time */}
          <button
            type="button"
            onClick={() => setShowCustomPicker(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <span className="type-body-sm font-medium text-[var(--text-primary)]">
                Choose date & time
              </span>
            </div>
            <span className="type-caption text-[var(--text-secondary)]">
              Custom
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="p-1 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center gap-1 type-caption font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to presets</span>
            </button>
          </div>

          <div>
            <label className="block type-caption text-[var(--text-secondary)] mb-1.5 font-medium">
              Select date & time (in your local timezone)
            </label>
            <input
              type="datetime-local"
              value={customDateTime}
              min={getDefaultDatetimeLocalString(0)}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 type-body-sm text-[var(--text-primary)] outline-none font-body"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--divider)]">
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="px-3 py-1.5 type-body-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmCustom}
              disabled={!customDateTime}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold type-button text-xs hover:opacity-90 cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span className="text-white">Reschedule</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
