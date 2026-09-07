import { SchedulePreset, TimeBucket } from '../types';

export function calculateDateFromPreset(preset: SchedulePreset): string | null {
  const now = new Date();

  switch (preset) {
    case 'later_today': {
      const target = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      return target.toISOString();
    }
    case 'tonight': {
      const target = new Date(now);
      if (now.getHours() >= 20) {
        target.setTime(now.getTime() + 2 * 60 * 60 * 1000);
      } else {
        target.setHours(20, 0, 0, 0);
      }
      return target.toISOString();
    }
    case 'tomorrow': {
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      return target.toISOString();
    }
    case 'this_weekend': {
      const target = new Date(now);
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + daysUntilSaturday);
      target.setHours(10, 0, 0, 0);
      return target.toISOString();
    }
    case 'next_week': {
      const target = new Date(now);
      const day = now.getDay();
      const daysUntilMonday = (1 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      target.setHours(9, 0, 0, 0);
      return target.toISOString();
    }
    case 'no_time':
    default:
      return null;
  }
}

export function getTimeBucket(scheduledFor: string | null): TimeBucket {
  if (!scheduledFor) return 'LATER';

  const date = new Date(scheduledFor);
  const now = new Date();

  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // If already due or within next 1 hour
  if (diffHours <= 1) {
    return 'NOW';
  }

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    if (date.getHours() >= 19) {
      return 'TONIGHT';
    }
    return 'TODAY';
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return 'TOMORROW';
  }

  // Within 7 days
  if (diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000) {
    return 'THIS WEEK';
  }

  return 'LATER';
}

export function formatReminderTime(scheduledFor: string | null): string {
  if (!scheduledFor) return 'No time set';

  const date = new Date(scheduledFor);
  const now = new Date();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return `Tomorrow, ${timeStr}`;
  }

  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays < 7) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${weekday} · ${timeStr}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
