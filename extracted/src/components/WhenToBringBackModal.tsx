import React, { useState } from 'react';
import { useLater } from '../context/LaterContext';
import { SchedulePreset, FlexiblePeriod, ItemReminder } from '../types';
import { calculateFlexibleTarget } from '../utils/reminderService';
import {
  Clock,
  Moon,
  Sun,
  CalendarDays,
  CalendarRange,
  Calendar,
  Sparkles,
  X,
  Check,
  Compass,
  Bell,
  Hourglass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabMode = 'flexible' | 'specific' | 'none';

export const WhenToBringBackModal: React.FC = () => {
  const { pendingItemForSchedule, setPendingItemForSchedule, setReminderForItem } = useLater();

  const [activeTab, setActiveTab] = useState<TabMode>('flexible');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDateTime, setCustomDateTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  if (!pendingItemForSchedule) return null;

  const item = pendingItemForSchedule;

  const handleFlexibleSelect = (period: FlexiblePeriod) => {
    const target = calculateFlexibleTarget(period);
    const reminder: ItemReminder = {
      type: 'flexible',
      flexiblePeriod: period,
      scheduledAt: target.iso,
      reminderStatus: 'waiting',
    };
    setReminderForItem(item.id, reminder);
    setPendingItemForSchedule(null);
  };

  const handleSpecificPreset = (preset: 'today_evening' | 'tomorrow_morning' | 'tomorrow_evening') => {
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

    const reminder: ItemReminder = {
      type: 'scheduled',
      scheduledAt: d.toISOString(),
      reminderStatus: 'waiting',
    };
    setReminderForItem(item.id, reminder);
    setPendingItemForSchedule(null);
  };

  const handleCustomConfirm = () => {
    if (!customDateTime) return;
    const iso = new Date(customDateTime).toISOString();
    const reminder: ItemReminder = {
      type: 'scheduled',
      scheduledAt: iso,
      reminderStatus: 'waiting',
    };
    setReminderForItem(item.id, reminder);
    setPendingItemForSchedule(null);
  };

  const handleNoTimeSelect = () => {
    const reminder: ItemReminder = {
      type: 'none',
      reminderStatus: 'waiting',
    };
    setReminderForItem(item.id, reminder);
    setPendingItemForSchedule(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop - simple clean semi-transparent scrim with ambient bleed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          onClick={() => setPendingItemForSchedule(null)}
          className="absolute inset-0 sheet-backdrop"
        />

        {/* Modal Window with 24px radius and saturated pink glass */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } }}
          exit={{ opacity: 0, y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          className="relative w-full max-w-md glass-schedule-sheet border-t sm:border border-[var(--border)] rounded-t-[24px] sm:rounded-[24px] p-5 sm:p-6 elevation-3 z-10 text-[var(--text-primary)] font-body max-h-[90vh] sm:max-h-[85vh] overflow-y-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <div>
              <p className="type-caption text-[var(--accent)] uppercase tracking-wider font-semibold">
                Schedule Reminder
              </p>
              <h3 className="type-heading text-[var(--text-primary)] mt-0.5">
                When should this be brought back?
              </h3>
            </div>
            <button
              onClick={() => setPendingItemForSchedule(null)}
              className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick item excerpt */}
          <div className="py-2.5 px-3.5 my-3 rounded-2xl schedule-preset-btn type-body-sm text-[var(--text-secondary)] truncate">
            {item.title}
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border)] mb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('flexible');
                setShowCustomPicker(false);
              }}
              className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-all text-center cursor-pointer ${
                activeTab === 'flexible'
                  ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Flexible time
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specific')}
              className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-all text-center cursor-pointer ${
                activeTab === 'specific'
                  ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Specific time
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('none');
                setShowCustomPicker(false);
              }}
              className={`py-1.5 px-2 text-xs rounded-lg font-medium transition-all text-center cursor-pointer ${
                activeTab === 'none'
                  ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              No time
            </button>
          </div>

          {/* TAB 1: FLEXIBLE TIME */}
          {activeTab === 'flexible' && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                Resurfaces naturally in your memory without rigid alarms.
              </p>

              <button
                type="button"
                onClick={() => handleFlexibleSelect('later_today')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Later today</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  In a few hours
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFlexibleSelect('tomorrow')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Tomorrow</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Next morning
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFlexibleSelect('weekend')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">This weekend</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Saturday morning
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFlexibleSelect('next_week')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <CalendarRange className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">Next week</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Monday morning
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: SPECIFIC TIME */}
          {activeTab === 'specific' && (
            <div>
              {!showCustomPicker ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                    Notifies you gently at the precise scheduled time.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleSpecificPreset('today_evening')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <Moon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Today</span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      7:00 PM
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpecificPreset('tomorrow_morning')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Tomorrow</span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      9:00 AM
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpecificPreset('tomorrow_evening')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <Moon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">Tomorrow evening</span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      7:00 PM
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomPicker(true)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl schedule-preset-btn text-left transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        Custom date & time
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--accent)] font-semibold">
                      Pick exact time →
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Select date & time
                    </label>
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--divider)]">
                    <button
                      type="button"
                      onClick={() => setShowCustomPicker(false)}
                      className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCustomConfirm}
                      className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold text-xs hover:opacity-90 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                    >
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span className="text-white">Set reminder</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NO TIME / REMEMBER */}
          {activeTab === 'none' && (
            <div className="p-4 rounded-2xl schedule-preset-btn text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-gold)] mx-auto">
                <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
              </div>
              <div>
                <h4 className="text-xs font-medium text-[var(--text-primary)]">
                  Save without a specific time
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 max-w-xs mx-auto leading-relaxed">
                  Saved in your Later memory. You can search for it anytime or let Later surface it when relevant.
                </p>
              </div>

              <button
                type="button"
                onClick={handleNoTimeSelect}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span className="text-white">Save to memory for someday</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
