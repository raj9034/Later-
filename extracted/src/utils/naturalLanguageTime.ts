import { SchedulePreset, TemporalType } from '../types';

export interface ParsedNaturalTimeResult {
  hasExplicitTime: boolean;
  scheduledAt: string | null; // ISO Date String in local timezone
  cleanTitle: string;
  temporalType: TemporalType;
  schedulePreset: SchedulePreset;
  timeHint?: string;
  matchedText?: string;
}

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

/**
 * Capitalizes string nicely
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Strips matched temporal phrases and clean up whitespace & punctuation
 */
function cleanTitleText(original: string, matchedPhrases: string[]): string {
  let cleaned = original;
  for (const phrase of matchedPhrases) {
    if (!phrase) continue;
    // Replace with regex word boundary if possible, or literal
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'gi');
    cleaned = cleaned.replace(regex, ' ');
  }

  // Clean trailing/leading dangling prepositions and punctuation: "at", "on", "for", "-", ":", ","
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\b(at|on|for|by|due|around|before)\s*$/i, '')
    .replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '')
    .trim();

  if (!cleaned) {
    // If the entire text was the temporal phrase, retain a sensible name
    return capitalize(original.trim());
  }

  return capitalize(cleaned);
}

/**
 * Formats a Date into a clean time string like "5:00 PM"
 */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats a Date into a complete hint like "Today at 5:00 PM" or "Tomorrow at 8:00 PM"
 */
export function formatDateTimeHint(date: Date, now: Date = new Date()): string {
  const timeStr = formatLocalTime(date);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    if (date.getHours() >= 19) {
      return `Tonight at ${timeStr}`;
    }
    return `Today at ${timeStr}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }

  const dayDiff = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDiff > 0 && dayDiff < 7) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${weekday} at ${timeStr}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Parses natural language input to detect explicit date/time reminders.
 * Runs in the user's LOCAL timezone.
 */
export function parseNaturalDateTime(
  rawInput: string,
  referenceDate: Date = new Date()
): ParsedNaturalTimeResult {
  const text = rawInput.trim();
  if (!text) {
    return {
      hasExplicitTime: false,
      scheduledAt: null,
      cleanTitle: '',
      temporalType: 'someday',
      schedulePreset: 'no_time',
    };
  }

  const lower = text.toLowerCase();
  const matchedPhrases: string[] = [];

  // =========================================================================
  // 1. RELATIVE TIME: "in 2 hours", "in 30 mins", "in 1 hr", "in half an hour"
  // =========================================================================
  const relativeMatch = lower.match(
    /\b(?:in\s+)?(\d+|half|an?)\s*(hours?|hrs?|minutes?|mins?)\b/i
  );
  if (relativeMatch) {
    let amount = 1;
    if (relativeMatch[1] === 'half') amount = 0.5;
    else if (relativeMatch[1] === 'a' || relativeMatch[1] === 'an') amount = 1;
    else amount = parseFloat(relativeMatch[1]);

    const unit = relativeMatch[2].toLowerCase();
    const isMinute = unit.startsWith('min');
    const addMs = isMinute ? amount * 60 * 1000 : amount * 60 * 60 * 1000;

    const targetDate = new Date(referenceDate.getTime() + addMs);
    matchedPhrases.push(relativeMatch[0]);

    // Also check if there was a preceding "in"
    const fullRelativeMatch = text.match(
      new RegExp(`\\bin\\s+${relativeMatch[1]}\\s*${relativeMatch[2]}\\b`, 'i')
    );
    if (fullRelativeMatch) {
      matchedPhrases.push(fullRelativeMatch[0]);
    }

    const isToday =
      targetDate.getDate() === referenceDate.getDate() &&
      targetDate.getMonth() === referenceDate.getMonth() &&
      targetDate.getFullYear() === referenceDate.getFullYear();

    const temporalType: TemporalType = isToday
      ? targetDate.getHours() >= 19
        ? 'tonight'
        : 'today'
      : 'tomorrow';

    const hint = isMinute
      ? `In ${amount} minute${amount === 1 ? '' : 's'} (${formatLocalTime(targetDate)})`
      : `In ${amount} hour${amount === 1 ? '' : 's'} (${formatLocalTime(targetDate)})`;

    return {
      hasExplicitTime: true,
      scheduledAt: targetDate.toISOString(),
      cleanTitle: cleanTitleText(text, matchedPhrases),
      temporalType,
      schedulePreset: isToday ? 'later_today' : 'tomorrow',
      timeHint: hint,
      matchedText: matchedPhrases.join(' '),
    };
  }

  // =========================================================================
  // 2. EXPLICIT CLOCK TIME EXTRACTION:
  //    - 12h AM/PM: "5pm", "5:00 pm", "at 6:59 AM", "12 am", "12 pm"
  //    - 24h / Colon time: "17:00", "6:59", "at 06:59"
  //    - "at 5", "at 9", "at 9:30"
  // =========================================================================
  let detectedHour: number | null = null;
  let detectedMinute: number | null = null;
  let hasExplicitClockDigits = false;
  let timePhrase: string | null = null;

  // A. 12-hour format with AM/PM (e.g., "6:59 AM", "5 PM", "5:30pm", "at 12 am", "12:00 pm")
  const ampmMatch = lower.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const meridian = ampmMatch[3].toLowerCase();

    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (meridian === 'pm') {
        h = h === 12 ? 12 : h + 12;
      } else if (meridian === 'am') {
        h = h === 12 ? 0 : h;
      }
      detectedHour = h;
      detectedMinute = m;
      hasExplicitClockDigits = true;
      timePhrase = ampmMatch[0];
      matchedPhrases.push(ampmMatch[0]);
    }
  }

  // B. Colon time (e.g., "17:00", "at 15:30", "at 6:59")
  if (detectedHour === null) {
    const colonMatch = lower.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i);
    if (colonMatch) {
      let h = parseInt(colonMatch[1], 10);
      const m = parseInt(colonMatch[2], 10);
      // Heuristic: if single digit hour like 6:59 without am/pm:
      // if 1 <= h <= 7, check if "morning" or "evening/night" is in text
      if (h >= 1 && h <= 7) {
        if (lower.includes('tonight') || lower.includes('evening') || lower.includes('night') || lower.includes('pm')) {
          h += 12;
        }
      }
      detectedHour = h;
      detectedMinute = m;
      hasExplicitClockDigits = true;
      timePhrase = colonMatch[0];
      matchedPhrases.push(colonMatch[0]);
    }
  }

  // C. "at <hour>" without AM/PM (e.g. "at 5", "at 9", "at 10")
  if (detectedHour === null) {
    const atHourMatch = lower.match(/\bat\s+(\d{1,2})\b/i);
    if (atHourMatch) {
      let h = parseInt(atHourMatch[1], 10);
      if (h >= 1 && h <= 23) {
        if (h >= 1 && h <= 7) {
          // Default 1..7 to afternoon / PM (1 PM .. 7 PM) unless morning is specified
          if (!lower.includes('morning')) {
            h += 12;
          }
        } else if (h >= 8 && h <= 11) {
          // If tonight / evening is present:
          if (lower.includes('tonight') || lower.includes('evening') || lower.includes('night')) {
            h += 12;
          }
        }
        detectedHour = h;
        detectedMinute = 0;
        hasExplicitClockDigits = true;
        timePhrase = atHourMatch[0];
        matchedPhrases.push(atHourMatch[0]);
      }
    }
  }

  // D. Named time periods if no explicit digits (e.g. "morning", "afternoon", "evening", "tonight")
  let periodWordPhrase: string | null = null;
  if (detectedHour === null) {
    if (lower.includes('morning')) {
      detectedHour = 9;
      detectedMinute = 0;
      periodWordPhrase = 'morning';
    } else if (lower.includes('noon') || lower.includes('midday')) {
      detectedHour = 12;
      detectedMinute = 0;
      periodWordPhrase = 'noon';
    } else if (lower.includes('afternoon')) {
      detectedHour = 14; // 2:00 PM
      detectedMinute = 0;
      periodWordPhrase = 'afternoon';
    } else if (lower.includes('evening')) {
      detectedHour = 19; // 7:00 PM
      detectedMinute = 0;
      periodWordPhrase = 'evening';
    } else if (lower.includes('tonight') || lower.includes('night')) {
      detectedHour = 20; // 8:30 PM
      detectedMinute = 30;
      periodWordPhrase = lower.includes('tonight') ? 'tonight' : 'night';
    }
  }

  // =========================================================================
  // 3. DATE / CALENDAR DAY EXTRACTION
  // =========================================================================
  let targetYear = referenceDate.getFullYear();
  let targetMonth = referenceDate.getMonth();
  let targetDay = referenceDate.getDate();
  let hasExplicitDate = false;
  let dateCategory: 'today' | 'tonight' | 'tomorrow' | 'this_weekend' | 'next_week' | 'custom' = 'today';

  // A. "Today" / "later today" / "this afternoon" / "this evening" / "tonight"
  if (
    lower.includes('today') ||
    lower.includes('later today') ||
    lower.includes('this afternoon') ||
    lower.includes('this evening') ||
    lower.includes('tonight')
  ) {
    hasExplicitDate = true;
    targetYear = referenceDate.getFullYear();
    targetMonth = referenceDate.getMonth();
    targetDay = referenceDate.getDate();

    if (lower.includes('tonight') || lower.includes('this evening')) {
      dateCategory = 'tonight';
      if (detectedHour === null) {
        if (referenceDate.getHours() >= 20) {
          detectedHour = referenceDate.getHours() + 2;
          detectedMinute = 0;
        } else {
          detectedHour = 20;
          detectedMinute = 30;
        }
      }
    } else {
      dateCategory = 'today';
    }

    // Capture phrase for cleanup
    const todayMatch = text.match(/\b(later today|today|this afternoon|this evening|tonight)\b/i);
    if (todayMatch) {
      matchedPhrases.push(todayMatch[0]);
    }
  }

  // B. "Tomorrow" / "tmrw"
  else if (lower.includes('tomorrow') || lower.includes('tmrw')) {
    hasExplicitDate = true;
    dateCategory = 'tomorrow';
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    targetYear = tomorrow.getFullYear();
    targetMonth = tomorrow.getMonth();
    targetDay = tomorrow.getDate();

    const tomorrowMatch = text.match(/\b(tomorrow|tmrw)\b/i);
    if (tomorrowMatch) {
      matchedPhrases.push(tomorrowMatch[0]);
    }
    if (periodWordPhrase) {
      const pMatch = text.match(new RegExp(`\\b${periodWordPhrase}\\b`, 'i'));
      if (pMatch) matchedPhrases.push(pMatch[0]);
    }
  }

  // C. Days of the week (e.g., "Friday", "this Friday", "next Monday", "on Tuesday")
  else {
    const dayMatch = lower.match(
      /\b(?:(this|next|upcoming|on)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i
    );
    if (dayMatch) {
      hasExplicitDate = true;
      const prefix = (dayMatch[1] || '').toLowerCase();
      const dayName = dayMatch[2].toLowerCase();
      const targetDayOfWeek = DAYS_OF_WEEK[dayName];

      const currentDayOfWeek = referenceDate.getDay();
      let diff = (targetDayOfWeek - currentDayOfWeek + 7) % 7;

      if (diff === 0) {
        // Today is that day
        if (prefix === 'next') {
          diff = 7;
        } else if (detectedHour !== null) {
          // If time today has already passed, push to next week's day
          const testTime = new Date(referenceDate);
          testTime.setHours(detectedHour, detectedMinute || 0, 0, 0);
          if (testTime.getTime() <= referenceDate.getTime()) {
            diff = 7;
          }
        }
      } else if (prefix === 'next' && diff < 7) {
        // "next <day>" when diff is positive (e.g. on Tuesday, "next Friday" -> usually Friday of next week or upcoming Friday)
        // In standard natural language: "next Monday" means the upcoming Monday (or next week if later).
      }

      const targetD = new Date(referenceDate);
      targetD.setDate(targetD.getDate() + diff);
      targetYear = targetD.getFullYear();
      targetMonth = targetD.getMonth();
      targetDay = targetD.getDate();

      if (targetDayOfWeek === 6 || targetDayOfWeek === 0) {
        dateCategory = 'this_weekend';
      } else if (diff >= 7 || prefix === 'next') {
        dateCategory = 'next_week';
      } else if (diff === 1) {
        dateCategory = 'tomorrow';
      } else if (diff === 0) {
        dateCategory = 'today';
      } else {
        dateCategory = 'custom';
      }

      const rawDayMatch = text.match(
        new RegExp(`\\b(?:(this|next|upcoming|on)\\s+)?${dayMatch[2]}\\b`, 'i')
      );
      if (rawDayMatch) {
        matchedPhrases.push(rawDayMatch[0]);
      }
    }
  }

  // D. "This weekend" / "weekend"
  if (!hasExplicitDate && (lower.includes('this weekend') || lower.includes('weekend'))) {
    hasExplicitDate = true;
    dateCategory = 'this_weekend';
    const day = referenceDate.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const targetD = new Date(referenceDate);
    targetD.setDate(targetD.getDate() + daysUntilSat);
    targetYear = targetD.getFullYear();
    targetMonth = targetD.getMonth();
    targetDay = targetD.getDate();

    if (detectedHour === null) {
      detectedHour = 10;
      detectedMinute = 0;
    }

    const wkMatch = text.match(/\b(this weekend|next weekend|weekend)\b/i);
    if (wkMatch) matchedPhrases.push(wkMatch[0]);
  }

  // E. "Next week"
  if (!hasExplicitDate && lower.includes('next week')) {
    hasExplicitDate = true;
    dateCategory = 'next_week';
    const day = referenceDate.getDay();
    const daysUntilMon = (1 - day + 7) % 7 || 7;
    const targetD = new Date(referenceDate);
    targetD.setDate(targetD.getDate() + daysUntilMon);
    targetYear = targetD.getFullYear();
    targetMonth = targetD.getMonth();
    targetDay = targetD.getDate();

    if (detectedHour === null) {
      detectedHour = 9;
      detectedMinute = 0;
    }

    const nwMatch = text.match(/\bnext week\b/i);
    if (nwMatch) matchedPhrases.push(nwMatch[0]);
  }

  // F. Specific month/day (e.g. "Sep 15", "August 31st", "October 5 at 3pm")
  if (!hasExplicitDate) {
    const monthMatch = lower.match(
      /\b(?:on\s+)?(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    );
    if (monthMatch) {
      const monthIdx = MONTHS[monthMatch[1].toLowerCase()];
      const dayNum = parseInt(monthMatch[2], 10);
      if (monthIdx !== undefined && dayNum >= 1 && dayNum <= 31) {
        hasExplicitDate = true;
        dateCategory = 'custom';
        targetMonth = monthIdx;
        targetDay = dayNum;

        // If date has already passed in current year, use next year
        const testD = new Date(targetYear, targetMonth, targetDay, detectedHour || 9, detectedMinute || 0, 0, 0);
        if (testD.getTime() < referenceDate.getTime()) {
          targetYear += 1;
        }

        const rawMonthMatch = text.match(
          new RegExp(`\\b(?:on\\s+)?${monthMatch[1]}\\s+${monthMatch[2]}(?:st|nd|rd|th)?\\b`, 'i')
        );
        if (rawMonthMatch) matchedPhrases.push(rawMonthMatch[0]);
      }
    }
  }

  // =========================================================================
  // 4. COMBINING & DETERMINING IF AN EXPLICIT REMINDER WAS SPECIFIED
  // =========================================================================

  // If no date and no time were found, return no reminder!
  if (!hasExplicitDate && detectedHour === null) {
    return {
      hasExplicitTime: false,
      scheduledAt: null,
      cleanTitle: text,
      temporalType: 'someday',
      schedulePreset: 'no_time',
    };
  }

  // Default hour if date was given but no hour was specified:
  if (detectedHour === null) {
    if (dateCategory === 'tonight') {
      detectedHour = 20;
      detectedMinute = 30;
    } else if (dateCategory === 'this_weekend') {
      detectedHour = 10;
      detectedMinute = 0;
    } else {
      detectedHour = 9;
      detectedMinute = 0;
    }
  }
  if (detectedMinute === null) {
    detectedMinute = 0;
  }

  // Construct target Date in LOCAL timezone
  let finalDate = new Date(targetYear, targetMonth, targetDay, detectedHour, detectedMinute, 0, 0);

  // If ONLY a time was provided (no explicit date, e.g. "Wake up Jason at 6:59 AM", "at 5 pm"):
  // If the time has already passed today, push to tomorrow morning/afternoon!
  if (!hasExplicitDate) {
    if (finalDate.getTime() <= referenceDate.getTime()) {
      finalDate.setDate(finalDate.getDate() + 1);
      dateCategory = 'tomorrow';
    } else {
      dateCategory = finalDate.getHours() >= 19 ? 'tonight' : 'today';
    }
  }

  // Determine temporalType and schedulePreset for Later state
  let temporalType: TemporalType = 'today';
  let schedulePreset: SchedulePreset = 'custom';

  const isToday =
    finalDate.getDate() === referenceDate.getDate() &&
    finalDate.getMonth() === referenceDate.getMonth() &&
    finalDate.getFullYear() === referenceDate.getFullYear();

  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    finalDate.getDate() === tomorrow.getDate() &&
    finalDate.getMonth() === tomorrow.getMonth() &&
    finalDate.getFullYear() === tomorrow.getFullYear();

  if (isToday) {
    temporalType = finalDate.getHours() >= 19 ? 'tonight' : 'today';
    schedulePreset = finalDate.getHours() >= 19 ? 'tonight' : 'later_today';
  } else if (isTomorrow) {
    temporalType = 'tomorrow';
    schedulePreset = 'tomorrow';
  } else if (dateCategory === 'this_weekend') {
    temporalType = 'this_weekend';
    schedulePreset = 'this_weekend';
  } else if (dateCategory === 'next_week') {
    temporalType = 'next_week';
    schedulePreset = 'next_week';
  } else {
    temporalType = 'custom';
    schedulePreset = 'custom';
  }

  let timeHint: string;
  if (!hasExplicitClockDigits && periodWordPhrase === null) {
    if (dateCategory === 'this_weekend') {
      timeHint = 'This weekend';
    } else if (dateCategory === 'tomorrow') {
      timeHint = 'Tomorrow';
    } else if (dateCategory === 'tonight') {
      timeHint = 'Tonight';
    } else if (dateCategory === 'next_week') {
      timeHint = 'Next week';
    } else {
      timeHint = formatDateTimeHint(finalDate, referenceDate);
    }
  } else {
    timeHint = formatDateTimeHint(finalDate, referenceDate);
  }

  const cleanTitle = cleanTitleText(text, matchedPhrases);

  return {
    hasExplicitTime: true,
    scheduledAt: finalDate.toISOString(),
    cleanTitle,
    temporalType,
    schedulePreset,
    timeHint,
    matchedText: matchedPhrases.join(' '),
  };
}
