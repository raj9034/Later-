export type ContentType =
  | 'video'
  | 'link'
  | 'article'
  | 'product'
  | 'screenshot'
  | 'image'
  | 'note'
  | 'idea'
  | 'task'
  | 'person'
  | 'phone_number'
  | 'place'
  | 'event';

// Backwards compatibility alias
export type ItemType = ContentType;

export type IntentType =
  | 'watch'
  | 'read'
  | 'visit'
  | 'call'
  | 'buy'
  | 'research'
  | 'remember'
  | 'complete'
  | 'meet'
  | 'explore';

export type TemporalType =
  | 'now'
  | 'today'
  | 'tonight'
  | 'tomorrow'
  | 'this_weekend'
  | 'next_week'
  | 'someday'
  | 'custom';

export type SchedulePreset =
  | 'later_today'
  | 'tonight'
  | 'tomorrow'
  | 'this_weekend'
  | 'next_week'
  | 'custom'
  | 'no_time';

export type ReminderType = 'none' | 'scheduled' | 'flexible';

export type FlexiblePeriod = 'later_today' | 'tomorrow' | 'weekend' | 'next_week';

export type ReminderStatus = 'waiting' | 'notified' | 'pending_recall';

export interface ItemReminder {
  type: ReminderType;
  scheduledAt?: string; // ISO date string
  flexiblePeriod?: FlexiblePeriod;
  notifiedAt?: string; // ISO date string when notification fired
  reminderStatus?: ReminderStatus;
}

export type TimeBucket =
  | 'NOW'
  | 'TODAY'
  | 'TONIGHT'
  | 'TOMORROW'
  | 'THIS WEEK'
  | 'LATER';

export type SwipeView =
  | 'ALL'
  | 'URGENT'
  | 'IMPORTANT'
  | 'CHILL'
  | 'LINKS'
  | 'SCREENSHOTS'
  | 'NOTES'
  | 'TASKS'
  | 'PEOPLE'
  | 'PLACES';

export type UrgencyTag = 'urgent' | 'important' | 'chill';

export interface SavedItem {
  id: string;
  title: string;
  summary?: string;
  rawInput: string;
  rawContent?: string; // alias
  contentType: ContentType;
  type?: ContentType; // alias
  intent: IntentType;
  createdAt: string; // ISO Date string
  reminderTime: string | null; // ISO Date string or null
  scheduledFor: string | null; // alias for backwards compatibility
  temporalType: TemporalType;
  schedulePreset?: SchedulePreset;
  reminder?: ItemReminder; // Enhanced persistent reminder model
  urgencyTag?: UrgencyTag; // Optional urgency/priority level tag
  urgency?: UrgencyTag; // Alias
  people: string[];
  places: string[];
  topics: string[];
  relatedMemoryIds: string[];

  // Visuals - ONLY present if user attached or uploaded an actual screenshot/image
  imageAttachment?: string; 
  url?: string;
  sourceDomain?: string;
  extractedMeta?: {
    platform?: string;
    phoneNumber?: string;
    personName?: string;
    address?: string;
    price?: string;
    eventDate?: string;
    timeHint?: string;
  };
  isDone: boolean;
  completedAt?: string; // ISO Date string when marked done/complete
  isArchived: boolean;
  archivedAt?: string; // ISO Date string when archived
  postponeCount?: number; // Number of times this item was rescheduled/postponed
  postponedAt?: string[]; // Timestamp history of postponements
  lastPostponedAt?: string; // Last time item was rescheduled
}

export interface DetectedAnalysis {
  contentType: ContentType;
  type: ContentType; // alias
  intent: IntentType;
  title: string;
  summary?: string;
  rawInput: string;
  temporalType: TemporalType;
  reminderTime: string | null;
  schedulePreset: SchedulePreset;
  reminder?: ItemReminder;
  urgencyTag?: UrgencyTag;
  urgency?: UrgencyTag;
  people: string[];
  places: string[];
  topics: string[];
  url?: string;
  sourceDomain?: string;
  imageAttachment?: string;
  extractedMeta?: {
    platform?: string;
    phoneNumber?: string;
    personName?: string;
    address?: string;
    price?: string;
    eventDate?: string;
    timeHint?: string;
  };
}
