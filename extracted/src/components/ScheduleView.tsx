import React from 'react';
import { useLater } from '../context/LaterContext';
import { SavedItem } from '../types';
import { TimelineItemRow } from './TimelineItemRow';
import { SystemState } from './ui/SystemState';
import { Calendar } from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const { items, isSyncing } = useLater();

  // Filter unarchived items that have scheduled times, sort strictly chronologically
  const scheduledItems = items
    .filter((i) => !i.isArchived && (i.reminderTime || i.scheduledFor))
    .sort((a, b) => {
      const timeA = new Date(a.reminderTime || a.scheduledFor!).getTime();
      const timeB = new Date(b.reminderTime || b.scheduledFor!).getTime();
      return timeA - timeB;
    });

  // Group by specific calendar day / label
  const groupedByDay: { label: string; items: SavedItem[] }[] = [];

  const now = new Date();
  const todayStr = now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  scheduledItems.forEach((item) => {
    const rawTime = item.reminderTime || item.scheduledFor!;
    const itemDate = new Date(rawTime);
    const itemDateStr = itemDate.toDateString();

    let dayLabel = '';
    if (itemDateStr === todayStr) {
      dayLabel = 'Today';
    } else if (itemDateStr === tomorrowStr) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = itemDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    const existingGroup = groupedByDay.find((g) => g.label === dayLabel);
    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      groupedByDay.push({ label: dayLabel, items: [item] });
    }
  });

  if (isSyncing) {
    return (
      <div id="schedule-view-container" className="w-full space-y-6 pt-2 pb-16">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="type-label text-[var(--text-secondary)]">Future Schedule</span>
        </div>
        <SystemState
          type="loading"
          className="later-skeleton"
          title="Loading your schedule…"
          description="Syncing your scheduled memories…"
        />
      </div>
    );
  }

  return (
    <div id="schedule-view-container" className="w-full space-y-6 pt-2 pb-16">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="type-label text-[var(--text-secondary)]">Future Schedule</span>
        <span className="type-caption text-[var(--text-tertiary)]">
          {scheduledItems.length} {scheduledItems.length === 1 ? 'reminder' : 'reminders'}
        </span>
      </div>

      {groupedByDay.length === 0 ? (
        <SystemState
          type="empty"
          icon={<Calendar className="w-8 h-8 text-[var(--text-tertiary)]" />}
          title="No scheduled reminders"
          description="Items saved with dates will appear here chronologically"
        />
      ) : (
        <div className="space-y-6">
          {groupedByDay.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-2.5 px-1 py-1">
                <span className="type-label text-[var(--text-primary)]">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-[var(--divider)]" />
                <span className="type-caption text-[var(--text-tertiary)]">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <TimelineItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
