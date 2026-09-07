import React, { useState } from 'react';
import { useLater } from '../context/LaterContext';
import { SavedItem, UrgencyTag } from '../types';
import { formatReminderTime } from '../utils/timeScheduler';
import { ResurfaceCard } from './ui/ResurfaceCard';
import { SystemState } from './ui/SystemState';
import { Flame, Star, Leaf, Sparkles } from 'lucide-react';

interface SurfacedPriorityItem {
  item: SavedItem;
  score: number;
  badgeLabel: string;
  whyNowExplanation: string;
  isUrgent: boolean;
}

const ACTION_KEYWORDS = [
  'tax',
  'taxes',
  'receipt',
  'receipts',
  'application',
  'invoice',
  'submit',
  'pay',
  'doctor',
  'dentist',
  'interview',
  'flight',
  'passport',
  'visa',
  'rent',
  'bill',
  'exam',
  'exams',
  'urgent',
  'asap',
];

export const WhatShouldIDealWith: React.FC = () => {
  const { items, setSelectedItem, toggleDone, setPendingItemForSchedule } = useLater();
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<UrgencyTag | null>(null);

  const now = new Date();

  // Counts for each urgency tag among uncompleted, unarchived items
  const priorityCount = items.filter(
    (i) => !i.isDone && !i.isArchived && (i.urgencyTag || i.urgency) === 'urgent'
  ).length;
  const importantCount = items.filter(
    (i) => !i.isDone && !i.isArchived && (i.urgencyTag || i.urgency) === 'important'
  ).length;
  const chillCount = items.filter(
    (i) => !i.isDone && !i.isArchived && (i.urgencyTag || i.urgency) === 'chill'
  ).length;

  // Evaluate candidate items for intelligent resurfacing
  const evaluatedItems: SurfacedPriorityItem[] = [];

  items.forEach((item) => {
    // Skip completed or archived items
    if (item.isDone || item.isArchived) return;

    const tag = item.urgencyTag || item.urgency;

    let score = 0;
    let badgeLabel = '';
    let whyNowExplanation = '';
    let isUrgent = false;

    // Calculate days since item was created
    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const daysAgo = createdDate
      ? Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // If item has explicit urgency tag, adjust base score
    if (tag === 'urgent') {
      score = 85;
      badgeLabel = 'Priority item';
      whyNowExplanation =
        daysAgo === 0
          ? 'Saved today, tagged Priority'
          : daysAgo === 1
          ? 'Saved yesterday, tagged Priority'
          : `Saved ${daysAgo} days ago, tagged Priority`;
      isUrgent = true;
    } else if (tag === 'important') {
      score = 70;
      badgeLabel = 'Important item';
      whyNowExplanation = "You marked this Important and haven't acted on it yet";
    } else if (tag === 'chill') {
      score = 65;
      badgeLabel = 'Chill item';
      whyNowExplanation = 'Tagged Chill and ready for review';
    }

    const postponeCount = item.postponeCount || 0;
    const itemTitleLower = (item.title || '').toLowerCase();
    const itemRawLower = (item.rawInput || '').toLowerCase();
    const isActionableContent =
      item.contentType === 'task' ||
      item.contentType === 'event' ||
      item.intent === 'complete' ||
      item.intent === 'call' ||
      item.intent === 'buy' ||
      ACTION_KEYWORDS.some((kw) => itemTitleLower.includes(kw) || itemRawLower.includes(kw));

    const scheduledTime = item.reminderTime || item.scheduledFor || item.reminder?.scheduledAt;

    if (scheduledTime) {
      const schedDate = new Date(scheduledTime);
      const diffMs = schedDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const isToday =
        schedDate.getDate() === now.getDate() &&
        schedDate.getMonth() === now.getMonth() &&
        schedDate.getFullYear() === now.getFullYear();

      // Rule 1 & 2: Items scheduled for today or approaching
      if (isToday) {
        const timeFormatted = schedDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        if (diffHours <= 0) {
          // Overdue or due now
          score = 120;
          badgeLabel = `Due · Today at ${timeFormatted}`;
          whyNowExplanation = `Due today at ${timeFormatted}`;
          isUrgent = true;
        } else if (diffHours <= 2) {
          // Approaching in under 2 hours
          score = 115;
          badgeLabel = `Approaching · Today at ${timeFormatted}`;
          whyNowExplanation = `Due today at ${timeFormatted}`;
          isUrgent = true;
        } else {
          // Scheduled for today
          score = 100;
          badgeLabel = `Today · ${timeFormatted}`;
          whyNowExplanation = `Scheduled for today at ${timeFormatted}`;
          isUrgent = false;
        }
      } else if (diffHours > 0 && diffHours <= 6) {
        // Approaching within 6 hours (e.g. early tomorrow)
        score = 90;
        badgeLabel = `Approaching · ${formatReminderTime(scheduledTime)}`;
        whyNowExplanation = `Approaching reminder (${formatReminderTime(scheduledTime)})`;
        isUrgent = true;
      }
    }

    // Rule 3: Items that have been postponed/rescheduled repeatedly
    if (postponeCount >= 2) {
      const postponeScore = 95 + postponeCount * 5;
      // If postpone score is higher or equal, surface with postponement badge
      if (postponeScore >= score) {
        score = postponeScore;
        badgeLabel = `Postponed ${postponeCount} times`;
        whyNowExplanation = `Postponed ${postponeCount} times and needs action`;
        isUrgent = false;
      }
    } else if (postponeCount === 1 && score < 70) {
      score = 70;
      badgeLabel = 'Postponed 1 time';
      whyNowExplanation = 'Postponed 1 time and needs action';
      isUrgent = false;
    }

    // Rule 4: Long-unresolved actionable items (created >= 3 days ago)
    if (score < 80 && isActionableContent && item.createdAt) {
      if (daysAgo >= 3) {
        const unresolvedScore = 65 + Math.min(daysAgo * 2, 20);
        if (unresolvedScore > score) {
          score = unresolvedScore;
          badgeLabel = `Unresolved for ${daysAgo} days`;
          whyNowExplanation = `Unresolved for ${daysAgo} days without action`;
          isUrgent = false;
        }
      }
    }

    // Rule 5: Actionable items that appear important based on actual content
    if (score < 60 && isActionableContent) {
      const hasImportantKeyword = ACTION_KEYWORDS.some(
        (kw) => itemTitleLower.includes(kw) || itemRawLower.includes(kw)
      );
      if (hasImportantKeyword) {
        score = 60;
        badgeLabel = 'Important action item';
        whyNowExplanation = 'Action-required task needing attention';
        isUrgent = true;
      }
    }

    // Rule 6: Recently captured items that appear time-sensitive (< 24h old)
    if (score < 50 && item.createdAt && createdDate) {
      const hoursOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      if (hoursOld < 24 && isActionableContent) {
        score = 50;
        badgeLabel = 'Recently captured · Action needed';
        whyNowExplanation = 'Captured recently and ready to tackle';
        isUrgent = false;
      }
    }

    if (!whyNowExplanation) {
      whyNowExplanation = 'Scheduled reminder just became active';
    }

    // Only include items that crossed the threshold
    if (score >= 45) {
      evaluatedItems.push({
        item,
        score,
        badgeLabel,
        whyNowExplanation,
        isUrgent,
      });
    }
  });

  // Filter evaluated items if a section-scoped urgency filter is active
  const filteredList = selectedUrgencyFilter
    ? evaluatedItems.filter(
        (entry) => (entry.item.urgencyTag || entry.item.urgency) === selectedUrgencyFilter
      )
    : evaluatedItems;

  // Sort by score descending and take the top items
  const surfacedList = filteredList
    .sort((a, b) => b.score - a.score)
    .slice(0, selectedUrgencyFilter ? 4 : 2);

  // Dynamically derive header subtitle reflecting the actual dataset
  const headerSubtitle = (() => {
    if (surfacedList.length === 0) return '0 items';
    if (selectedUrgencyFilter) {
      const label = selectedUrgencyFilter === 'urgent' ? 'priority' : selectedUrgencyFilter;
      return `${surfacedList.length} ${label} ${surfacedList.length === 1 ? 'item' : 'items'}`;
    }
    const tags = surfacedList.map((entry) => entry.item.urgencyTag || entry.item.urgency);
    const allPriority = tags.every((t) => t === 'urgent');
    const allImportant = tags.every((t) => t === 'important');
    const allChill = tags.every((t) => t === 'chill');

    if (allPriority) {
      return `${surfacedList.length} priority ${surfacedList.length === 1 ? 'item' : 'items'}`;
    }
    if (allImportant) {
      return `${surfacedList.length} important ${surfacedList.length === 1 ? 'item' : 'items'}`;
    }
    if (allChill) {
      return `${surfacedList.length} chill ${surfacedList.length === 1 ? 'item' : 'items'}`;
    }
    return `${surfacedList.length} ${surfacedList.length === 1 ? 'item' : 'items'} to deal with`;
  })();

  if (evaluatedItems.length === 0) {
    return (
      <div id="what-should-i-deal-with-empty" className="w-full">
        <SystemState
          id="what-should-i-deal-with-system-state"
          type="completed"
          icon={<Sparkles className="w-6 h-6 text-[var(--accent-gold)] stroke-[1.5]" />}
          title="Nothing urgent right now — you're all caught up."
          description="Priority items and actionable tasks will surface here as they require attention."
          className="py-5 px-4 rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div
      id="what-should-i-deal-with-section"
      className="w-full rounded-2xl glass-elevated p-3 space-y-2 elevation-1"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5 pb-1 border-b border-[var(--divider)]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          <span className="type-heading text-[var(--text-primary)] font-semibold">
            What should I deal with?
          </span>
        </div>
        <span className="type-caption text-[var(--text-secondary)] text-[11px] font-mono">
          {headerSubtitle}
        </span>
      </div>

      {/* Scoped Urgency Filter Chips - Strict 8px gap to cards below */}
      <div id="what-should-i-deal-with-filters" className="flex items-center gap-1.5 select-none overflow-x-auto no-scrollbar">
        {/* Priority Filter */}
        <button
          id="deal-with-filter-priority"
          type="button"
          onClick={() => setSelectedUrgencyFilter((prev) => (prev === 'urgent' ? null : 'urgent'))}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border active:scale-[0.97] press-interactive ${
            selectedUrgencyFilter === 'urgent'
              ? 'tab-filter-urgent-active'
              : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <Flame className={`w-3 h-3 shrink-0 ${selectedUrgencyFilter === 'urgent' ? 'text-white' : 'text-[var(--accent)] dark:text-[#D98A9C]'}`} />
          <span className="font-medium text-[11.5px] whitespace-nowrap">Priority</span>
          {priorityCount > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                selectedUrgencyFilter === 'urgent'
                  ? 'bg-white/25 text-white'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
              }`}
            >
              {priorityCount}
            </span>
          )}
        </button>

        {/* Important Filter */}
        <button
          id="deal-with-filter-important"
          type="button"
          onClick={() => setSelectedUrgencyFilter((prev) => (prev === 'important' ? null : 'important'))}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border active:scale-[0.97] press-interactive ${
            selectedUrgencyFilter === 'important'
              ? 'tab-filter-important-active'
              : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <Star className={`w-3 h-3 shrink-0 ${selectedUrgencyFilter === 'important' ? 'text-white' : 'text-[var(--accent-gold)] dark:text-[#CDB484]'}`} />
          <span className="font-medium text-[11.5px] whitespace-nowrap">Important</span>
          {importantCount > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                selectedUrgencyFilter === 'important'
                  ? 'bg-white/25 text-white'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
              }`}
            >
              {importantCount}
            </span>
          )}
        </button>

        {/* Chill Filter */}
        <button
          id="deal-with-filter-chill"
          type="button"
          onClick={() => setSelectedUrgencyFilter((prev) => (prev === 'chill' ? null : 'chill'))}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border active:scale-[0.97] press-interactive ${
            selectedUrgencyFilter === 'chill'
              ? 'tab-filter-chill-active'
              : 'bg-[var(--surface-sunken)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <Leaf className={`w-3 h-3 shrink-0 ${selectedUrgencyFilter === 'chill' ? 'text-white dark:text-[#12111A]' : 'text-[#5A7F9E] dark:text-[#E4E6ED]'}`} />
          <span className="font-medium text-[11.5px] whitespace-nowrap">Chill</span>
          {chillCount > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                selectedUrgencyFilter === 'chill'
                  ? 'bg-white/25 text-white dark:bg-black/15 dark:text-[#12111A]'
                  : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
              }`}
            >
              {chillCount}
            </span>
          )}
        </button>
      </div>

      {/* Surfaced Items List - Strict 8px gap between stacked cards */}
      {surfacedList.length === 0 ? (
        <div className="py-4 text-center text-xs text-[var(--text-tertiary)] select-none">
          No items tagged {selectedUrgencyFilter === 'urgent' ? 'Priority' : selectedUrgencyFilter === 'important' ? 'Important' : 'Chill'} found.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {surfacedList.map(({ item, badgeLabel, whyNowExplanation, isUrgent }, idx) => (
            <ResurfaceCard
              key={`deal-with-${item.id}`}
              item={item}
              reason={badgeLabel}
              whyNowExplanation={whyNowExplanation}
              isUrgent={isUrgent}
              staggerIndex={idx}
              onOpen={(it) => setSelectedItem(it)}
              onComplete={(id) => toggleDone(id)}
              onSnooze={(id) => {
                const it = items.find((x) => x.id === id);
                if (it) setPendingItemForSchedule(it);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

