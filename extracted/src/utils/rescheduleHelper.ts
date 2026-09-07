import { formatReminderTime } from './timeScheduler';

export type ReschedulePresetId =
  | 'in_10_minutes'
  | 'in_1_hour'
  | 'tonight'
  | 'tomorrow'
  | 'this_weekend'
  | 'next_week';

export interface ReschedulePresetOption {
  id: ReschedulePresetId;
  label: string;
  sublabel: string;
  getIso: () => string;
}

/**
 * Calculates the exact ISO timestamp for the quick reschedule presets
 * using the user's local timezone.
 */
export function getRescheduleIso(preset: ReschedulePresetId): string {
  const now = new Date();

  switch (preset) {
    case 'in_10_minutes': {
      const target = new Date(now.getTime() + 10 * 60 * 1000);
      return target.toISOString();
    }
    case 'in_1_hour': {
      const target = new Date(now.getTime() + 60 * 60 * 1000);
      return target.toISOString();
    }
    case 'tonight': {
      const target = new Date(now);
      if (now.getHours() >= 20) {
        // If already late tonight, schedule 2 hours later
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
  }
}

/**
 * Returns the list of standard reschedule presets with dynamic local time previews
 */
export function getReschedulePresetOptions(): ReschedulePresetOption[] {
  const now = new Date();

  // In 10 min
  const tenMinDate = new Date(now.getTime() + 10 * 60 * 1000);
  const tenMinTimeStr = tenMinDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  // In 1 hour
  const oneHourDate = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourTimeStr = oneHourDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Tonight
  const tonightDate = new Date(now);
  if (now.getHours() >= 20) {
    tonightDate.setTime(now.getTime() + 2 * 60 * 60 * 1000);
  } else {
    tonightDate.setHours(20, 0, 0, 0);
  }
  const tonightTimeStr = tonightDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return [
    {
      id: 'in_10_minutes',
      label: 'In 10 minutes',
      sublabel: tenMinTimeStr,
      getIso: () => getRescheduleIso('in_10_minutes'),
    },
    {
      id: 'in_1_hour',
      label: 'In 1 hour',
      sublabel: oneHourTimeStr,
      getIso: () => getRescheduleIso('in_1_hour'),
    },
    {
      id: 'tonight',
      label: 'Tonight',
      sublabel: tonightTimeStr,
      getIso: () => getRescheduleIso('tonight'),
    },
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      sublabel: '9:00 AM',
      getIso: () => getRescheduleIso('tomorrow'),
    },
    {
      id: 'this_weekend',
      label: 'This weekend',
      sublabel: 'Saturday 10:00 AM',
      getIso: () => getRescheduleIso('this_weekend'),
    },
    {
      id: 'next_week',
      label: 'Next week',
      sublabel: 'Monday 9:00 AM',
      getIso: () => getRescheduleIso('next_week'),
    },
  ];
}

/**
 * Returns a default datetime-local formatted string (YYYY-MM-DDTHH:mm) in local timezone
 */
export function getDefaultDatetimeLocalString(offsetHours = 2): string {
  const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
