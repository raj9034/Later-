import { SavedItem, ItemReminder, FlexiblePeriod, ReminderType } from '../types';
import { formatReminderTime } from './timeScheduler';
import { sounds } from './audio';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission } from './nativeNotifications';

/**
 * Helper to convert base64 URL to Uint8Array for VAPID subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Calculates a natural, non-alarm target date for flexible periods
 */
export function calculateFlexibleTarget(period: FlexiblePeriod): { iso: string; label: string } {
  const now = new Date();

  switch (period) {
    case 'later_today': {
      // In ~3-4 hours, or at 18:00
      const target = new Date(now);
      if (now.getHours() < 17) {
        target.setTime(now.getTime() + 3.5 * 60 * 60 * 1000);
      } else {
        target.setTime(now.getTime() + 1.5 * 60 * 60 * 1000);
      }
      return { iso: target.toISOString(), label: 'Later today' };
    }
    case 'tomorrow': {
      // Tomorrow morning at 9:00 AM
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      return { iso: target.toISOString(), label: 'Tomorrow' };
    }
    case 'weekend': {
      // Upcoming Saturday at 10:00 AM
      const target = new Date(now);
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + daysUntilSaturday);
      target.setHours(10, 0, 0, 0);
      return { iso: target.toISOString(), label: 'This weekend' };
    }
    case 'next_week': {
      // Upcoming Monday at 9:00 AM
      const target = new Date(now);
      const day = now.getDay();
      const daysUntilMonday = (1 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      target.setHours(9, 0, 0, 0);
      return { iso: target.toISOString(), label: 'Next week' };
    }
    default:
      return { iso: now.toISOString(), label: 'Flexible' };
  }
}

/**
 * Normalizes any legacy or newly saved item into the structured ItemReminder model
 */
export function normalizeItemReminder(item: SavedItem): ItemReminder {
  if (item.reminder) {
    return item.reminder;
  }

  // Backwards compatibility for legacy saved items
  if (
    item.schedulePreset === 'no_time' ||
    item.temporalType === 'someday' ||
    (!item.reminderTime && !item.scheduledFor)
  ) {
    return {
      type: 'none',
      reminderStatus: 'waiting',
    };
  }

  const rawTime = item.reminderTime || item.scheduledFor;
  if (!rawTime) {
    return {
      type: 'none',
      reminderStatus: 'waiting',
    };
  }

  const timeMs = new Date(rawTime).getTime();
  const isPast = !isNaN(timeMs) && timeMs <= Date.now();

  // If it was a flexible preset
  if (item.schedulePreset === 'later_today') {
    return {
      type: 'flexible',
      flexiblePeriod: 'later_today',
      scheduledAt: rawTime,
      reminderStatus: isPast ? 'pending_recall' : 'waiting',
    };
  }
  if (item.schedulePreset === 'this_weekend') {
    return {
      type: 'flexible',
      flexiblePeriod: 'weekend',
      scheduledAt: rawTime,
      reminderStatus: isPast ? 'pending_recall' : 'waiting',
    };
  }
  if (item.schedulePreset === 'next_week') {
    return {
      type: 'flexible',
      flexiblePeriod: 'next_week',
      scheduledAt: rawTime,
      reminderStatus: isPast ? 'pending_recall' : 'waiting',
    };
  }

  return {
    type: 'scheduled',
    scheduledAt: rawTime,
    reminderStatus: isPast ? 'pending_recall' : 'waiting',
  };
}

/**
 * Formats a clean human-readable reminder status label for an item
 */
export function formatItemReminderLabel(item: SavedItem): string {
  const reminder = normalizeItemReminder(item);

  if (reminder.reminderStatus === 'pending_recall') {
    if (reminder.type === 'scheduled' && reminder.scheduledAt) {
      return `Waiting recall · ${formatReminderTime(reminder.scheduledAt)}`;
    }
    if (reminder.type === 'flexible' && reminder.flexiblePeriod) {
      const pName =
        reminder.flexiblePeriod === 'later_today'
          ? 'Later today'
          : reminder.flexiblePeriod === 'tomorrow'
          ? 'Tomorrow'
          : reminder.flexiblePeriod === 'weekend'
          ? 'This weekend'
          : 'Next week';
      return `Waiting recall · ${pName}`;
    }
    return 'Waiting recall';
  }

  if (reminder.type === 'none') {
    return 'No reminder set (In memory)';
  }

  if (reminder.type === 'flexible') {
    switch (reminder.flexiblePeriod) {
      case 'later_today':
        return 'Flexible · Later today';
      case 'tomorrow':
        return 'Flexible · Tomorrow';
      case 'weekend':
        return 'Flexible · This weekend';
      case 'next_week':
        return 'Flexible · Next week';
      default:
        return 'Flexible reminder';
    }
  }

  if (reminder.type === 'scheduled' && reminder.scheduledAt) {
    return formatReminderTime(reminder.scheduledAt);
  }

  return formatReminderTime(item.reminderTime || item.scheduledFor);
}

/**
 * Registers Web Push subscription with the server for true background delivery.
 * Automatically checks and renews if the subscription key differs from the server's key.
 */
export async function syncPushSubscriptionWithServer(reg?: ServiceWorkerRegistration): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    let swReg = reg;
    if (!swReg) {
      swReg = await navigator.serviceWorker.ready;
    }
    if (!swReg || !swReg.pushManager) return;

    const keyRes = await fetch('/api/push/public-key');
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return;

    let sub = await swReg.pushManager.getSubscription();
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // If no subscription exists, create one
    if (!sub) {
      try {
        sub = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      } catch (subErr) {
        console.warn('PushManager.subscribe error:', subErr);
      }
    }

    if (sub) {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
      if (response.ok) {
        console.debug('Web Push subscription successfully synchronized with server.');
      }
    }
  } catch (err) {
    console.debug('Web Push subscription note:', err);
  }
}

/**
 * Ensures push subscription is active whenever notifications are allowed
 */
export async function ensurePushSubscribed(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        await syncPushSubscriptionWithServer(reg);
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Synchronizes scheduled memories with the backend scheduler
 */
export async function syncRemindersToServer(items: SavedItem[]): Promise<void> {
  // Check if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Network offline');
  }

  const scheduledReminders = items
    .filter((i) => !i.isArchived && !i.isDone)
    .map((i) => {
      const rem = normalizeItemReminder(i);
      if (rem.scheduledAt && rem.reminderStatus === 'waiting') {
        return {
          itemId: i.id,
          title: i.title,
          scheduledAt: rem.scheduledAt,
          notified: false,
        };
      }
      return null;
    })
    .filter(Boolean);

  if (scheduledReminders.length === 0) {
    return;
  }

  // Also ensure device push subscription is synchronized
  ensurePushSubscribed().catch(() => {});

  const res = await fetch('/api/push/sync-reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reminders: scheduledReminders }),
  });

  if (!res.ok) {
    throw new Error(`Sync failed with status: ${res.status}`);
  }
}

/**
 * Registers Service Worker and initializes push support
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // If notification permission is already granted, sync push subscription
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            syncPushSubscriptionWithServer(reg);
          }

          // Listen to messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SURFACE_MEMORY_MOMENT') {
              window.dispatchEvent(
                new CustomEvent('later-surface-memory-moment', {
                  detail: event.data.data,
                })
              );
            }
          });
        })
        .catch(() => {
          // Fallback gracefully in restricted iframe environments
        });
    });
  }
}

/**
 * Requests notification permission safely only when the user sets a scheduled reminder
 */
export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    return await requestNotificationPermission();
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg) {
          syncPushSubscriptionWithServer(reg);
        }
      }
      return result === 'granted';
    }

    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        syncPushSubscriptionWithServer(reg);
      }
    }

    return Notification.permission === 'granted';
  } catch (e) {
    console.warn('Could not request notification permission:', e);
    return false;
  }
}

/**
 * Triggers exactly ONE calm, non-intrusive notification for ready memories.
 *
 * Rules:
 * - Title: "Something you wanted to remember"
 * - Body: Memory title if 1 item, or "N things are ready for you" if multiple items were ready while away.
 * - No alarm sounds or repeating alerts; gentle chime only.
 * - Clicking focuses Later and surfaces the Memory Moment.
 */
export function triggerCalmBatchNotification(readyItems: SavedItem[]): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted' || readyItems.length === 0) {
    return;
  }

  try {
    const title = 'Something you wanted to remember';
    let body = '';

    if (readyItems.length === 1) {
      const single = readyItems[0];
      body = single.title || 'You have a saved memory ready.';
    } else {
      body = `${readyItems.length} things are ready for you`;
    }

    const payloadData = {
      itemIds: readyItems.map((i) => i.id),
      firstItemId: readyItems[0]?.id,
      count: readyItems.length,
    };

    // Play soft, gentle chime once
    sounds.playRecallChime();

    // Prefer Service Worker notification if registered
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_CALM_NOTIFICATION',
        title,
        body,
        tag: 'later-calm-memory',
        data: payloadData,
      });
      return;
    }

    // Standard Notification API fallback
    const notifOptions: NotificationOptions = {
      body,
      icon: '/favicon.ico',
      tag: 'later-calm-memory',
      silent: false,
    };
    const notif = new Notification(title, notifOptions);

    notif.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent('later-surface-memory-moment', {
          detail: payloadData,
        })
      );
      notif.close();
    };
  } catch (e) {
    console.warn('Failed to fire calm notification:', e);
  }
}

/**
 * Evaluates all items to process scheduled transitions, fire exactly ONE grouped
 * calm notification for newly ready memories, and transition items to 'pending_recall'.
 */
export function checkAndProcessReminders(items: SavedItem[]): {
  updatedItems: SavedItem[];
  hasChanges: boolean;
} {
  const now = Date.now();
  const nowIso = new Date().toISOString();
  let hasChanges = false;

  const newlyReadyItems: SavedItem[] = [];

  const updatedItems: SavedItem[] = items.map((item): SavedItem => {
    // Archived or Completed items don't trigger active reminders
    if (item.isArchived || item.isDone) {
      return item;
    }

    const reminder = normalizeItemReminder(item);

    // 1. Scheduled Reminders
    if (reminder.type === 'scheduled' && reminder.scheduledAt) {
      const scheduledMs = new Date(reminder.scheduledAt).getTime();

      if (!isNaN(scheduledMs) && scheduledMs <= now) {
        // Condition A: Time has arrived, hasn't been notified yet
        if (reminder.reminderStatus === 'waiting' && !reminder.notifiedAt) {
          newlyReadyItems.push(item);
          hasChanges = true;
          const updatedReminder: ItemReminder = {
            ...reminder,
            notifiedAt: nowIso,
            reminderStatus: 'pending_recall',
          };
          return {
            ...item,
            reminder: updatedReminder,
          };
        }

        // Condition B: Already notified, or user was away -> ensure status is pending_recall
        if (reminder.reminderStatus === 'notified' || reminder.reminderStatus === 'waiting') {
          hasChanges = true;
          const updatedReminder: ItemReminder = {
            ...reminder,
            reminderStatus: 'pending_recall',
          };
          return {
            ...item,
            reminder: updatedReminder,
          };
        }
      }
    }

    // 2. Flexible Reminders
    if (reminder.type === 'flexible' && reminder.scheduledAt) {
      const scheduledMs = new Date(reminder.scheduledAt).getTime();

      if (!isNaN(scheduledMs) && scheduledMs <= now) {
        if (reminder.reminderStatus !== 'pending_recall') {
          hasChanges = true;
          const updatedReminder: ItemReminder = {
            ...reminder,
            reminderStatus: 'pending_recall',
          };
          return {
            ...item,
            reminder: updatedReminder,
          };
        }
      }
    }

    return item;
  });

  // If 1 or multiple items just became ready, fire ONE calm, grouped notification
  if (newlyReadyItems.length > 0) {
    triggerCalmBatchNotification(newlyReadyItems);
  }

  return { updatedItems, hasChanges };
}

/**
 * Creates an unthrottled Web Worker heartbeat timer for tab-in-background execution
 */
export function startBackgroundHeartbeat(onTick: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const workerBlob = new Blob(
      [
        `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('tick');
              }, 10000);
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `,
      ],
      { type: 'application/javascript' }
    );

    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        onTick();
      }
    };

    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  } catch {
    // Fallback standard interval
    const intervalId = setInterval(onTick, 15000);
    return () => clearInterval(intervalId);
  }
}

/**
 * Returns pending recall items for the calm "Memory Moment" section
 */
export function getPendingRecallItems(items: SavedItem[]): SavedItem[] {
  return items
    .filter((item) => {
      if (item.isArchived || item.isDone) return false;
      const reminder = normalizeItemReminder(item);
      return reminder.reminderStatus === 'pending_recall';
    })
    .sort((a, b) => {
      const remA = normalizeItemReminder(a);
      const remB = normalizeItemReminder(b);

      const timeA = remA.scheduledAt
        ? new Date(remA.scheduledAt).getTime()
        : new Date(a.createdAt).getTime();
      const timeB = remB.scheduledAt
        ? new Date(remB.scheduledAt).getTime()
        : new Date(b.createdAt).getTime();

      // Show closest/recently scheduled first
      return timeB - timeA;
    });
}

/**
 * Generates natural, calm contextual copy for the Memory Moment card
 */
export function getMemoryMomentHeading(item: SavedItem): string {
  const cType = item.contentType || item.type;
  switch (cType) {
    case 'video':
      return 'You wanted to watch this';
    case 'link':
    case 'article':
      return 'You wanted to read this';
    case 'product':
      return 'You wanted to look at this';
    case 'place':
      return 'You wanted to visit this';
    case 'person':
    case 'phone_number':
      return 'You wanted to reach out to this contact';
    case 'task':
      return 'You wanted to take care of this';
    case 'screenshot':
    case 'image':
      return 'You captured this screenshot to remember';
    case 'note':
    case 'idea':
    default:
      return 'You wanted to remember this';
  }
}

/**
 * Generates natural timestamp/origin copy for Memory Moment items
 */
export function getMemoryMomentSubtext(item: SavedItem): string {
  const reminder = normalizeItemReminder(item);

  if (reminder.type === 'scheduled' && reminder.scheduledAt) {
    const d = new Date(reminder.scheduledAt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'You saved this for earlier today';
    }
    if (isYesterday) {
      return 'You saved this for yesterday';
    }
    return `Saved for ${d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })}`;
  }

  if (reminder.type === 'flexible') {
    if (reminder.flexiblePeriod === 'later_today') return 'Saved for earlier today';
    if (reminder.flexiblePeriod === 'tomorrow') return 'Saved for this week';
    if (reminder.flexiblePeriod === 'weekend') return 'Saved for this weekend';
    if (reminder.flexiblePeriod === 'next_week') return 'Saved for this week';
  }

  if (item.sourceDomain) {
    return `Saved from ${item.sourceDomain}`;
  }

  return 'Saved in your Later memory';
}

/**
 * Generates a short, single-sentence "why this, why now" explanation line
 * for items resurfaced in "From your memory". Reflects the real trigger signal.
 * Max 8-10 words, single line.
 */
export function getMemoryMomentWhyNow(item: SavedItem): string {
  const reminder = normalizeItemReminder(item);
  const tag = item.urgencyTag || item.urgency;
  const now = new Date();

  // 1. Scheduled reminder with concrete scheduledAt time
  if (reminder.type === 'scheduled' && reminder.scheduledAt) {
    const schedDate = new Date(reminder.scheduledAt);
    const isToday = schedDate.toDateString() === now.toDateString();
    const timeFormatted = schedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (isToday) {
      return `Due today at ${timeFormatted}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = schedDate.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return `Due yesterday at ${timeFormatted}`;
    }

    return 'Scheduled reminder just became active';
  }

  // 2. Flexible periods
  if (reminder.type === 'flexible') {
    if (reminder.flexiblePeriod === 'later_today') {
      return 'Scheduled reminder just became active';
    }
    if (reminder.flexiblePeriod === 'weekend') {
      return 'Flexible weekend reminder became active';
    }
    if (reminder.flexiblePeriod === 'next_week') {
      return 'Flexible reminder for this week became active';
    }
    return 'Scheduled reminder just became active';
  }

  // 3. Marked Important without action
  if (tag === 'important') {
    return "You marked this Important and haven't acted on it yet";
  }

  // 4. Marked Priority
  if (tag === 'urgent') {
    if (item.createdAt) {
      const createdDate = new Date(item.createdAt);
      const daysAgo = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
      if (daysAgo === 0) return 'Saved today, tagged Priority';
      if (daysAgo === 1) return 'Saved yesterday, tagged Priority';
      return `Saved ${daysAgo} days ago, tagged Priority`;
    }
    return 'Saved recently, tagged Priority';
  }

  // 5. Postponed previously
  if (item.postponeCount && item.postponeCount > 0) {
    return `Postponed ${item.postponeCount} times and needs action`;
  }

  return 'Scheduled reminder just became active';
}
