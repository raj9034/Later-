import { Capacitor } from '@capacitor/core';
import { LocalNotifications, Channel } from '@capacitor/local-notifications';
import { SavedItem } from '../types';

export const LATER_REMINDER_CHANNEL_ID = 'later_reminders';

// Hash string item ID into a deterministic 32-bit positive integer for Android Notification IDs
export function hashItemIdToNotificationId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const positive = Math.abs(hash) % 2147483000;
  return positive > 0 ? positive : 1;
}

let isChannelCreated = false;
let isListenerRegistered = false;

/**
 * Ensures the Android notification channel exists (required for Android 8.0+ / API 26+)
 */
export async function setupNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isChannelCreated) return;

  try {
    const channel: Channel = {
      id: LATER_REMINDER_CHANNEL_ID,
      name: 'Later Reminders',
      description: 'Scheduled reminders and resurfaced memories from Later',
      importance: 5, // High importance (heads-up notification)
      visibility: 1, // Public visibility
      vibration: true,
      lights: true,
      lightColor: '#FFAA33',
    };

    await LocalNotifications.createChannel(channel);
    isChannelCreated = true;
  } catch (error) {
    console.warn('[Later Native Notifications] Failed to create notification channel:', error);
  }
}

/**
 * Verifies and requests Exact Alarm permission (Android 14+ / API 34+ SCHEDULE_EXACT_ALARM)
 * If exact alarms are not permitted, prompts the user and directs them to system settings.
 */
export async function checkAndRequestExactAlarmPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;

  try {
    const status = await LocalNotifications.checkExactNotificationSetting();
    if (status.exact_alarm === 'granted') {
      return true;
    }

    // Android 14+ requires user action in Settings to grant exact alarm scheduling
    const proceed = window.confirm(
      'Later needs permission to deliver exact reminders on time. Would you like to enable Alarms & Reminders in Settings?'
    );
    if (proceed) {
      await LocalNotifications.changeExactNotificationSetting();
    }
    return false;
  } catch (error) {
    // Older Android versions or unsupported platforms don't have or need exact alarm checks
    console.warn('[Later Native Notifications] Exact alarm check skipped or unsupported:', error);
    return true;
  }
}

/**
 * Requests runtime notification permission (Required for Android 13+ / API 33+ POST_NOTIFICATIONS)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback
    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
    }
    return false;
  }

  try {
    await setupNotificationChannel();
    const currentStatus = await LocalNotifications.checkPermissions();
    if (currentStatus.display === 'granted') {
      await checkAndRequestExactAlarmPermission();
      return true;
    }

    const requestResult = await LocalNotifications.requestPermissions();
    const granted = requestResult.display === 'granted';
    if (granted) {
      await checkAndRequestExactAlarmPermission();
    }
    return granted;
  } catch (error) {
    console.warn('[Later Native Notifications] Error requesting permission:', error);
    return false;
  }
}

/**
 * Initializes notification listeners (e.g. user taps on a notification to open the item)
 */
export function initNativeNotificationListeners(): void {
  if (!Capacitor.isNativePlatform() || isListenerRegistered) return;

  try {
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const itemId = action.notification?.extra?.itemId;
      if (itemId) {
        window.dispatchEvent(
          new CustomEvent('later-open-item-detail', {
            detail: { itemId },
          })
        );
      }
    });
    isListenerRegistered = true;
  } catch (error) {
    console.warn('[Later Native Notifications] Error setting up notification listener:', error);
  }
}

/**
 * Determines the target notification timestamp for a SavedItem if scheduled
 */
function getTargetReminderTimestamp(item: SavedItem): number | null {
  if (item.isArchived || item.isDone) return null;

  // 1. Explicit reminder target
  if (
    item.reminder &&
    item.reminder.type !== 'none' &&
    item.reminder.reminderStatus === 'waiting' &&
    item.reminder.scheduledAt
  ) {
    const time = new Date(item.reminder.scheduledAt).getTime();
    if (!isNaN(time)) return time;
  }

  // 2. Scheduled date/time
  if (item.reminderTime) {
    const scheduledTime = new Date(item.reminderTime).getTime();
    if (!isNaN(scheduledTime)) {
      return scheduledTime;
    }
  }

  if (item.scheduledFor) {
    const scheduledTime = new Date(item.scheduledFor).getTime();
    if (!isNaN(scheduledTime)) {
      return scheduledTime;
    }
  }

  return null;
}

/**
 * Schedules or updates a native Android local notification for a specific memory item
 */
export async function scheduleNativeNotification(item: SavedItem): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const targetTimestamp = getTargetReminderTimestamp(item);
  const now = Date.now();
  const notifId = hashItemIdToNotificationId(item.id);

  try {
    // Ensure channel is ready
    await setupNotificationChannel();

    // Cancel existing scheduled notification for this item first to avoid duplicates
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch {
      // ignore
    }

    // Only schedule if the target time is in the future
    if (targetTimestamp && targetTimestamp > now) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: item.title ? item.title : 'Later Reminder',
            body: item.summary || item.rawInput || 'Scheduled memory for Later',
            schedule: {
              at: new Date(targetTimestamp),
              allowWhileIdle: true, // Fire even in Android Doze mode
            },
            channelId: LATER_REMINDER_CHANNEL_ID,
            extra: {
              itemId: item.id,
            },
            foreground: true,
          },
        ],
      });
    }
  } catch (error) {
    console.warn(`[Later Native Notifications] Failed to schedule notification for item ${item.id}:`, error);
  }
}

/**
 * Cancels a scheduled native notification when an item is completed, archived, or deleted
 */
export async function cancelNativeNotification(itemId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const notifId = hashItemIdToNotificationId(itemId);
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
  } catch (error) {
    console.warn(`[Later Native Notifications] Failed to cancel notification for item ${itemId}:`, error);
  }
}

/**
 * Syncs the items with Android LocalNotifications using intelligent diffing:
 * - Cancels pending notifications that are no longer scheduled or have passed
 * - Schedules new future notifications that are not yet registered with the system
 */
export async function syncAllNativeNotifications(items: SavedItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await setupNotificationChannel();
    const now = Date.now();

    // Map all active items to their desired notification specs
    const desiredMap = new Map<number, { id: number; title: string; body: string; at: number; itemId: string }>();

    for (const item of items) {
      const targetTimestamp = getTargetReminderTimestamp(item);
      if (targetTimestamp && targetTimestamp > now) {
        const id = hashItemIdToNotificationId(item.id);
        desiredMap.set(id, {
          id,
          title: item.title ? item.title : 'Later Reminder',
          body: item.summary || item.rawInput || 'Scheduled memory for Later',
          at: targetTimestamp,
          itemId: item.id,
        });
      }
    }

    // Retrieve currently pending alarms from Capacitor
    const pendingResult = await LocalNotifications.getPending();
    const pendingList = pendingResult.notifications || [];
    const pendingMap = new Map<number, typeof pendingList[0]>();

    for (const p of pendingList) {
      pendingMap.set(p.id, p);
    }

    // Cancel pending notifications that are no longer desired or whose target schedule changed
    const toCancel: { id: number }[] = [];
    for (const [pId, p] of pendingMap.entries()) {
      const desired = desiredMap.get(pId);
      if (!desired) {
        toCancel.push({ id: pId });
      } else if (p.schedule?.at) {
        const existingAt = new Date(p.schedule.at).getTime();
        // If scheduled time differs by more than 1 second, cancel so it can be re-scheduled
        if (Math.abs(existingAt - desired.at) > 1000) {
          toCancel.push({ id: pId });
          pendingMap.delete(pId); // mark removed so it will be re-scheduled
        }
      }
    }

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }

    // Find notifications that need to be scheduled
    const toSchedule = [];
    for (const [dId, desired] of desiredMap.entries()) {
      if (!pendingMap.has(dId)) {
        toSchedule.push({
          id: desired.id,
          title: desired.title,
          body: desired.body,
          schedule: {
            at: new Date(desired.at),
            allowWhileIdle: true,
          },
          channelId: LATER_REMINDER_CHANNEL_ID,
          extra: {
            itemId: desired.itemId,
          },
          foreground: true,
        });
      }
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: toSchedule,
      });
    }
  } catch (error) {
    console.warn('[Later Native Notifications] Error in syncAllNativeNotifications:', error);
  }
}
