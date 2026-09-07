import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SavedItem, SwipeView, SchedulePreset, ItemReminder, TemporalType, UrgencyTag } from '../types';
import { initialSampleItems } from '../data/sampleData';
import { useAuth } from './AuthContext';
import { analyzeContent, calculateRelatedMemories } from '../utils/intelligence';
import { calculateDateFromPreset, formatReminderTime } from '../utils/timeScheduler';
import { processAutoArchive } from '../utils/autoArchiveService';
import {
  checkAndProcessReminders,
  normalizeItemReminder,
  calculateFlexibleTarget,
  requestNotificationPermissionIfNeeded,
  registerServiceWorker,
  startBackgroundHeartbeat,
  syncRemindersToServer,
} from '../utils/reminderService';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  initNativeNotificationListeners,
  syncAllNativeNotifications,
} from '../utils/nativeNotifications';
import { SendIntent, parseSharedContent, SharedContent } from '../utils/sendIntentService';
import { Capacitor } from '@capacitor/core';
import { sounds } from '../utils/audio';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LaterContextType {
  items: SavedItem[];
  isSyncing: boolean;
  activeSwipeView: SwipeView;
  setActiveSwipeView: (view: SwipeView) => void;
  viewMode: 'grouped' | 'schedule';
  setViewMode: (mode: 'grouped' | 'schedule') => void;

  // Save Flow
  pendingItemForSchedule: SavedItem | null;
  setPendingItemForSchedule: (item: SavedItem | null) => void;
  saveItem: (
    content: string,
    imageAttachment?: string,
    explicitReminder?: ItemReminder | null,
    urgencyTag?: UrgencyTag
  ) => SavedItem;
  applyScheduleToPending: (
    preset: SchedulePreset,
    customIso?: string,
    reminderOverride?: ItemReminder
  ) => void;

  // Item Operations
  selectedItem: SavedItem | null;
  setSelectedItem: (item: SavedItem | null) => void;
  snoozeItem: (
    id: string,
    preset: SchedulePreset,
    customIso?: string,
    reminderOverride?: ItemReminder
  ) => void;
  rescheduleItem: (id: string, isoTimestamp: string) => void;
  setReminderForItem: (id: string, reminder: ItemReminder) => void;
  toggleDone: (id: string) => void;
  archiveItem: (id: string) => void;
  deleteItem: (id: string) => void;
  setItemUrgency: (id: string, tag: UrgencyTag | null) => void;
  updateItemContent: (
    itemId: string,
    updates: { title?: string; summary?: string; rawInput?: string }
  ) => void;
  openItem: (id: string) => void;
  runAutoArchiveCheck: () => void;
  runReminderCheck: () => void;

  // Feedback Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Android Share Sheet
  sharedPrefill: { text?: string; image?: string } | null;
  setSharedPrefill: (prefill: { text?: string; image?: string } | null) => void;
  isSharedLaunch: boolean;

  // Reset
  resetData: () => void | Promise<void>;
}

const LaterContext = createContext<LaterContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'later_universal_items_v6';

const getStorageKey = (uid?: string | null): string => {
  if (uid) {
    return `later_user_items_${uid}`;
  }
  return GUEST_STORAGE_KEY;
};

const loadStoredItems = (uid?: string | null): SavedItem[] => {
  const key = getStorageKey(uid);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const rawItems = JSON.parse(stored);
      const { updatedItems: archivedItems } = processAutoArchive(rawItems);
      const { updatedItems: reminderProcessed } = checkAndProcessReminders(archivedItems);
      return reminderProcessed;
    }
  } catch {
    // ignore
  }

  // If unauthenticated guest without prior stored items, supply initial sample items
  if (!uid) {
    const { updatedItems: archivedItems } = processAutoArchive(initialSampleItems);
    const { updatedItems: reminderProcessed } = checkAndProcessReminders(archivedItems);
    return reminderProcessed;
  }

  // Newly authenticated user starts with a clean, isolated memory space
  return [];
};

export const LaterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const prevUidRef = useRef<string | null | undefined>(undefined);
  const isInitializedRef = useRef<boolean>(false);

  const [items, setItems] = useState<SavedItem[]>(() => {
    return loadStoredItems(null);
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [activeSwipeView, setActiveSwipeView] = useState<SwipeView>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'schedule'>('grouped');
  const [pendingItemForSchedule, setPendingItemForSchedule] = useState<SavedItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Android Share Sheet Integration
  const [sharedPrefill, setSharedPrefill] = useState<{ text?: string; image?: string } | null>(null);
  const [isSharedLaunch, setIsSharedLaunch] = useState<boolean>(false);

  const toastQueueRef = useRef<string[]>([]);
  const isShowingToastRef = useRef<boolean>(false);
  const isFirstPersistenceRef = useRef<boolean>(true);

  const processToastQueue = useCallback(() => {
    if (isShowingToastRef.current || toastQueueRef.current.length === 0) return;
    const nextMsg = toastQueueRef.current.shift();
    if (!nextMsg) return;

    isShowingToastRef.current = true;
    setToastMessage(nextMsg);

    setTimeout(() => {
      setToastMessage(null);
      setTimeout(() => {
        isShowingToastRef.current = false;
        processToastQueue();
      }, 250);
    }, 2800);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastQueueRef.current.includes(msg)) return;
    toastQueueRef.current.push(msg);
    processToastQueue();
  }, [processToastQueue]);

  // Helper to persist document to Firestore for authenticated users
  const writeFirestoreDoc = useCallback(
    async (itemId: string, data: Partial<SavedItem>) => {
      if (!user?.uid) return;
      try {
        const itemRef = doc(db, 'users', user.uid, 'items', itemId);
        await setDoc(itemRef, JSON.parse(JSON.stringify(data)), { merge: true });
      } catch (err) {
        console.error('Firestore doc write failure:', err);
        showToast("Saved on this device — will sync when back online");
      }
    },
    [user?.uid, showToast]
  );

  // Helper to delete document from Firestore for authenticated users
  const deleteFirestoreDoc = useCallback(
    async (itemId: string) => {
      if (!user?.uid) return;
      try {
        const itemRef = doc(db, 'users', user.uid, 'items', itemId);
        await deleteDoc(itemRef);
      } catch (err) {
        console.error('Firestore doc delete failure:', err);
        showToast("Saved on this device — will sync when back online");
      }
    },
    [user?.uid, showToast]
  );

  // Synchronize isolated memory boundary and subscribe to Firestore on authentication
  useEffect(() => {
    if (authLoading) return;
    const currentUid = user?.uid || null;

    if (currentUid) {
      // Authenticated user: real-time Firestore sync
      setIsSyncing(true);
      prevUidRef.current = currentUid;
      setSelectedItem(null);
      setPendingItemForSchedule(null);

      const itemsColRef = collection(db, 'users', currentUid, 'items');
      const unsubscribe = onSnapshot(
        itemsColRef,
        (snapshot) => {
          const firestoreItems: SavedItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SavedItem;
            firestoreItems.push({
              ...data,
              id: docSnap.id,
            });
          });

          firestoreItems.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          const { updatedItems: archivedItems } = processAutoArchive(firestoreItems);
          const { updatedItems: reminderProcessed } = checkAndProcessReminders(archivedItems);
          setItems(reminderProcessed);

          try {
            localStorage.setItem(getStorageKey(currentUid), JSON.stringify(reminderProcessed));
          } catch {
            // ignore
          }
          isInitializedRef.current = true;
          setIsSyncing(false);
        },
        (error) => {
          console.warn('Firestore subscription notice, using local cache:', error);
          const cached = loadStoredItems(currentUid);
          if (cached.length > 0) {
            setItems(cached);
          }
          isInitializedRef.current = true;
          setIsSyncing(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } else {
      // Guest mode: unauthenticated users use local-only storage
      isInitializedRef.current = true;
      setIsSyncing(false);
      if (prevUidRef.current !== null) {
        prevUidRef.current = null;
        setItems(loadStoredItems(null));
        setSelectedItem(null);
        setPendingItemForSchedule(null);
      }
    }
  }, [user?.uid, authLoading]);

  // Background Auto-Archive Routine
  const runAutoArchiveCheck = useCallback(() => {
    setItems((prevItems) => {
      const { updatedItems, archivedItemIds } = processAutoArchive(prevItems);
      if (archivedItemIds.length > 0) {
        return updatedItems;
      }
      return prevItems;
    });
  }, []);

  // Background Reminder Lifecycle Routine
  const runReminderCheck = useCallback(() => {
    setItems((prevItems) => {
      const { updatedItems, hasChanges } = checkAndProcessReminders(prevItems);
      if (hasChanges) {
        return updatedItems;
      }
      return prevItems;
    });
  }, []);

  // Initialize Service Worker and Native Notification Channels once
  useEffect(() => {
    registerServiceWorker();
    setupNotificationChannel();
    initNativeNotificationListeners();
    requestNotificationPermission();

    // Check if opened with ?surfaceMemory=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('surfaceMemory') === 'true') {
        setActiveSwipeView('ALL');
        setViewMode('grouped');
      }
    }
  }, []);

  // Periodic background check, unthrottled heartbeat, and visibility focus listeners
  useEffect(() => {
    runAutoArchiveCheck();
    runReminderCheck();

    // Unthrottled Web Worker heartbeat (ticks even when tab is in background)
    const stopHeartbeat = startBackgroundHeartbeat(() => {
      runAutoArchiveCheck();
      runReminderCheck();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runAutoArchiveCheck();
        runReminderCheck();
      }
    };

    const handleFocus = () => {
      runAutoArchiveCheck();
      runReminderCheck();
    };

    const handleOpenItemDetail = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string }>;
      if (customEvent.detail?.itemId) {
        const found = items.find((i) => i.id === customEvent.detail.itemId);
        if (found) {
          setSelectedItem(found);
        }
      }
    };

    const handleSurfaceMemoryMoment = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemIds?: string[]; firstItemId?: string; count?: number }>;
      setActiveSwipeView('ALL');
      setViewMode('grouped');
      if (customEvent.detail?.count === 1 && customEvent.detail?.firstItemId) {
        const found = items.find((i) => i.id === customEvent.detail.firstItemId);
        if (found) {
          setSelectedItem(found);
        }
      } else {
        setSelectedItem(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('later-open-item-detail', handleOpenItemDetail);
    window.addEventListener('later-surface-memory-moment', handleSurfaceMemoryMoment);

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('later-open-item-detail', handleOpenItemDetail);
      window.removeEventListener('later-surface-memory-moment', handleSurfaceMemoryMoment);
    };
  }, [runAutoArchiveCheck, runReminderCheck, items]);

  // Android Share Sheet Integration (ACTION_SEND / ACTION_SEND_MULTIPLE)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isSubscribed = true;

    const handleSharedData = (data: SharedContent) => {
      if (!isSubscribed) return;
      const parsed = parseSharedContent(data);
      if (parsed) {
        setIsSharedLaunch(true);
        setSharedPrefill({
          text: parsed.text,
          image: parsed.image,
        });

        // Close any modals or detail sheets so capture input is front and center
        setSelectedItem(null);
        setPendingItemForSchedule(null);
        setIsSearchOpen(false);

        // Friendly confirmation toast
        if (parsed.sourceType === 'image') {
          showToast('Image received from share sheet · Tap Remember to save');
        } else if (parsed.sourceType === 'link') {
          showToast('Link received from share sheet · Tap Remember to save');
        } else {
          showToast('Note received from share sheet · Tap Remember to save');
        }
      }
    };

    // 1. Cold start / initial app launch intent check
    SendIntent.getSharedContent()
      .then((data) => {
        if (data && data.hasContent) {
          handleSharedData(data);
          SendIntent.clearSharedContent().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('[Later SendIntent] getSharedContent error:', err);
      });

    // 2. Warm start / background app receive intent listener
    let listenerHandle: any = null;
    SendIntent.addListener('sharedContentReceived', (data) => {
      if (data && data.hasContent) {
        handleSharedData(data);
        SendIntent.clearSharedContent().catch(() => {});
      }
    })
      .then((handle) => {
        listenerHandle = handle;
      })
      .catch((err) => {
        console.warn('[Later SendIntent] addListener error:', err);
      });

    // 3. Re-check on visibilitychange and focus in case intent arrived while sleeping
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        SendIntent.getSharedContent()
          .then((data) => {
            if (data && data.hasContent) {
              handleSharedData(data);
              SendIntent.clearSharedContent().catch(() => {});
            }
          })
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      isSubscribed = false;
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [showToast]);

  useEffect(() => {
    if (authLoading || !isInitializedRef.current) return;

    const isInitial = isFirstPersistenceRef.current;
    if (isInitial) {
      isFirstPersistenceRef.current = false;
    }

    try {
      const key = getStorageKey(user?.uid);
      localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      if (!isInitial) {
        showToast("Couldn't save locally — storage may be full.");
      }
    }

    syncRemindersToServer(items).catch(() => {
      if (!isInitial) {
        showToast("Saved on this device — will sync when back online");
      }
    });

    try {
      syncAllNativeNotifications(items);
    } catch {
      // ignore
    }
  }, [items, user?.uid, authLoading, showToast]);

  // 1. Universal Intelligent Capture: Instant AI understanding & automatic scheduling
  const saveItem = (
    content: string,
    imageAttachment?: string,
    explicitReminder?: ItemReminder | null,
    urgencyTag?: UrgencyTag
  ): SavedItem => {
    try {
      const analysis = analyzeContent(content, imageAttachment);
      const nowIso = new Date().toISOString();

    let reminderData: ItemReminder = {
      type: 'none',
      reminderStatus: 'waiting',
    };
    let effectiveReminderTime: string | null = null;
    let effectiveTemporalType: TemporalType = 'someday';
    let effectiveSchedulePreset: SchedulePreset = 'no_time';

    // Priority 1: User explicitly configured a manual reminder
    if (explicitReminder !== undefined && explicitReminder !== null) {
      reminderData = explicitReminder;
      effectiveReminderTime = explicitReminder.scheduledAt || null;
      if (effectiveReminderTime) {
        const scheduledDate = new Date(effectiveReminderTime);
        const now = new Date();
        const isToday =
          scheduledDate.getDate() === now.getDate() &&
          scheduledDate.getMonth() === now.getMonth() &&
          scheduledDate.getFullYear() === now.getFullYear();

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow =
          scheduledDate.getDate() === tomorrow.getDate() &&
          scheduledDate.getMonth() === tomorrow.getMonth() &&
          scheduledDate.getFullYear() === tomorrow.getFullYear();

        if (isToday) {
          effectiveTemporalType = scheduledDate.getHours() >= 19 ? 'tonight' : 'today';
          effectiveSchedulePreset = scheduledDate.getHours() >= 19 ? 'tonight' : 'later_today';
        } else if (isTomorrow) {
          effectiveTemporalType = 'tomorrow';
          effectiveSchedulePreset = 'tomorrow';
        } else {
          effectiveTemporalType = 'custom';
          effectiveSchedulePreset = 'custom';
        }
      } else {
        effectiveTemporalType = 'someday';
        effectiveSchedulePreset = 'no_time';
      }
    } else if (analysis.reminderTime) {
      // Priority 2: Natural language extracted reminder
      effectiveReminderTime = analysis.reminderTime;
      effectiveTemporalType = analysis.temporalType;
      effectiveSchedulePreset = analysis.schedulePreset;

      reminderData = {
        type: 'scheduled',
        scheduledAt: analysis.reminderTime,
        reminderStatus: 'waiting',
      };
    }

    const effectiveUrgency = urgencyTag || analysis.urgencyTag || analysis.urgency;

    const tempItem: SavedItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: analysis.title,
      summary: analysis.summary,
      rawInput: content,
      rawContent: content,
      contentType: analysis.contentType,
      type: analysis.contentType,
      intent: analysis.intent,
      imageAttachment: analysis.imageAttachment,
      url: analysis.url,
      sourceDomain: analysis.sourceDomain,
      extractedMeta: analysis.extractedMeta,
      reminderTime: effectiveReminderTime,
      scheduledFor: effectiveReminderTime,
      temporalType: effectiveTemporalType,
      schedulePreset: effectiveSchedulePreset,
      reminder: reminderData,
      urgencyTag: effectiveUrgency,
      urgency: effectiveUrgency,
      createdAt: nowIso,
      people: analysis.people,
      places: analysis.places,
      topics: analysis.topics,
      relatedMemoryIds: [],
      isDone: false,
      isArchived: false,
    };

    // Calculate cross-memory connections against existing items
    const relatedIds = calculateRelatedMemories(tempItem, items, 3);
    tempItem.relatedMemoryIds = relatedIds;

    // Also update existing items to cross-link with this new item if related
    setItems((prev) => {
      const updatedExisting = prev.map((it) => {
        if (relatedIds.includes(it.id) && !it.relatedMemoryIds.includes(tempItem.id)) {
          return {
            ...it,
            relatedMemoryIds: [tempItem.id, ...it.relatedMemoryIds].slice(0, 3),
          };
        }
        return it;
      });
      return [tempItem, ...updatedExisting];
    });

    if (user?.uid) {
      writeFirestoreDoc(tempItem.id, tempItem);
    }

    sounds.playSaveChime();

    // Natural toast confirming intelligent detection and reminder
    let toastLabel = 'Saved to memory';
    if (analysis.extractedMeta?.timeHint) {
      toastLabel = `Saved · ${capitalize(analysis.intent)} · ${analysis.extractedMeta.timeHint}`;
    } else if (analysis.reminderTime) {
      toastLabel = `Saved · ${capitalize(analysis.intent)} · ${formatReminderTime(analysis.reminderTime)}`;
    } else {
      toastLabel = `Saved · ${capitalize(analysis.intent)} for someday`;
    }

    showToast(toastLabel);
    return tempItem;
    } catch (err) {
      console.error('Failed to save item:', err);
      showToast("Couldn't save item — please try again.");
      throw err;
    }
  };

  // Explicit helper to set/change reminder on any item
  const setReminderForItem = async (id: string, reminder: ItemReminder) => {
    sounds.playTap();
    if (reminder.type === 'scheduled' || reminder.type === 'flexible') {
      const granted = await requestNotificationPermissionIfNeeded();
      if (!granted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
        showToast('Notifications are blocked — enable in Settings to receive alerts');
      }
    }

    let isoDate: string | null = null;
    let preset: SchedulePreset = 'custom';

    if (reminder.type === 'none') {
      preset = 'no_time';
      isoDate = null;
    } else if (reminder.type === 'flexible') {
      if (reminder.flexiblePeriod === 'later_today') preset = 'later_today';
      else if (reminder.flexiblePeriod === 'tomorrow') preset = 'tomorrow';
      else if (reminder.flexiblePeriod === 'weekend') preset = 'this_weekend';
      else if (reminder.flexiblePeriod === 'next_week') preset = 'next_week';
      isoDate =
        reminder.scheduledAt ||
        calculateFlexibleTarget(reminder.flexiblePeriod || 'later_today').iso;
    } else if (reminder.type === 'scheduled') {
      isoDate = reminder.scheduledAt || new Date().toISOString();
      preset = 'custom';
    }

    const nowIso = new Date().toISOString();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const isPostponing = Boolean(it.reminderTime || it.scheduledFor || it.reminder?.scheduledAt);
        const newPostponeCount = isPostponing ? (it.postponeCount || 0) + 1 : (it.postponeCount || 0);
        const newPostponedAt = isPostponing ? [...(it.postponedAt || []), nowIso] : (it.postponedAt || []);

        return {
          ...it,
          reminder: {
            ...reminder,
            scheduledAt: isoDate || undefined,
            reminderStatus: 'waiting',
          },
          scheduledFor: isoDate,
          reminderTime: isoDate,
          schedulePreset: preset,
          postponeCount: newPostponeCount,
          postponedAt: newPostponedAt,
          lastPostponedAt: isPostponing ? nowIso : it.lastPostponedAt,
          isDone: false,
        };
      })
    );

    if (selectedItem?.id === id) {
      setSelectedItem((curr) => {
        if (!curr) return null;
        const isPostponing = Boolean(curr.reminderTime || curr.scheduledFor || curr.reminder?.scheduledAt);
        return {
          ...curr,
          reminder: {
            ...reminder,
            scheduledAt: isoDate || undefined,
            reminderStatus: 'waiting',
          },
          scheduledFor: isoDate,
          reminderTime: isoDate,
          schedulePreset: preset,
          postponeCount: isPostponing ? (curr.postponeCount || 0) + 1 : (curr.postponeCount || 0),
          postponedAt: isPostponing ? [...(curr.postponedAt || []), nowIso] : (curr.postponedAt || []),
          lastPostponedAt: isPostponing ? nowIso : curr.lastPostponedAt,
          isDone: false,
        };
      });
    }

    if (user?.uid) {
      writeFirestoreDoc(id, {
        reminder: {
          ...reminder,
          scheduledAt: isoDate || undefined,
          reminderStatus: 'waiting',
        },
        scheduledFor: isoDate,
        reminderTime: isoDate,
        schedulePreset: preset,
        isDone: false,
      });
    }

    if (reminder.type === 'none') {
      showToast('Saved in memory');
    } else if (reminder.type === 'flexible') {
      const pName =
        reminder.flexiblePeriod === 'later_today'
          ? 'Later today'
          : reminder.flexiblePeriod === 'tomorrow'
          ? 'Tomorrow'
          : reminder.flexiblePeriod === 'weekend'
          ? 'This weekend'
          : 'Next week';
      showToast(`Reminder set · ${pName}`);
    } else {
      showToast(isoDate ? `Reminder: ${formatReminderTime(isoDate)}` : 'Reminder set');
    }
  };

  // 2. Set/Adjust Schedule
  const applyScheduleToPending = (
    preset: SchedulePreset,
    customIso?: string,
    reminderOverride?: ItemReminder
  ) => {
    if (!pendingItemForSchedule) return;

    if (reminderOverride) {
      setReminderForItem(pendingItemForSchedule.id, reminderOverride);
      setPendingItemForSchedule(null);
      return;
    }

    sounds.playTap();
    if (preset !== 'no_time') {
      requestNotificationPermissionIfNeeded().then((granted) => {
        if (!granted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
          showToast('Notifications are blocked — enable in Settings to receive alerts');
        }
      });
    }

    let scheduledDate: string | null = null;
    let reminderData: ItemReminder = {
      type: 'none',
      reminderStatus: 'waiting',
    };

    if (preset === 'custom' && customIso) {
      scheduledDate = customIso;
      reminderData = {
        type: 'scheduled',
        scheduledAt: customIso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'later_today') {
      const target = calculateFlexibleTarget('later_today');
      scheduledDate = target.iso;
      reminderData = {
        type: 'flexible',
        flexiblePeriod: 'later_today',
        scheduledAt: target.iso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'this_weekend') {
      const target = calculateFlexibleTarget('weekend');
      scheduledDate = target.iso;
      reminderData = {
        type: 'flexible',
        flexiblePeriod: 'weekend',
        scheduledAt: target.iso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'next_week') {
      const target = calculateFlexibleTarget('next_week');
      scheduledDate = target.iso;
      reminderData = {
        type: 'flexible',
        flexiblePeriod: 'next_week',
        scheduledAt: target.iso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'tomorrow' || preset === 'tonight') {
      scheduledDate = calculateDateFromPreset(preset);
      reminderData = {
        type: 'scheduled',
        scheduledAt: scheduledDate || undefined,
        reminderStatus: 'waiting',
      };
    } else {
      scheduledDate = null;
      reminderData = {
        type: 'none',
        reminderStatus: 'waiting',
      };
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === pendingItemForSchedule.id
          ? {
              ...it,
              scheduledFor: scheduledDate,
              reminderTime: scheduledDate,
              schedulePreset: preset,
              reminder: reminderData,
            }
          : it
      )
    );

    if (user?.uid) {
      writeFirestoreDoc(pendingItemForSchedule.id, {
        scheduledFor: scheduledDate,
        reminderTime: scheduledDate,
        schedulePreset: preset,
        reminder: reminderData,
      });
    }

    setPendingItemForSchedule(null);
    showToast(scheduledDate ? `Reminder: ${formatReminderTime(scheduledDate)}` : 'Saved for someday');
  };

  // 3. Snooze / Reschedule
  const snoozeItem = (
    id: string,
    preset: SchedulePreset,
    customIso?: string,
    reminderOverride?: ItemReminder
  ) => {
    if (reminderOverride) {
      setReminderForItem(id, reminderOverride);
      return;
    }

    sounds.playTap();
    if (preset !== 'no_time') {
      requestNotificationPermissionIfNeeded().then((granted) => {
        if (!granted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
          showToast('Notifications are blocked — enable in Settings to receive alerts');
        }
      });
    }

    let scheduledDate: string | null = null;
    let reminderData: ItemReminder = {
      type: 'none',
      reminderStatus: 'waiting',
    };

    if (preset === 'custom' && customIso) {
      scheduledDate = customIso;
      reminderData = {
        type: 'scheduled',
        scheduledAt: customIso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'later_today') {
      const target = calculateFlexibleTarget('later_today');
      scheduledDate = target.iso;
      reminderData = {
        type: 'flexible',
        flexiblePeriod: 'later_today',
        scheduledAt: target.iso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'this_weekend') {
      const target = calculateFlexibleTarget('weekend');
      scheduledDate = target.iso;
      reminderData = {
        type: 'flexible',
        flexiblePeriod: 'weekend',
        scheduledAt: target.iso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'next_week') {
      const target = calculateFlexibleTarget('next_week');
      scheduledDate = target.iso;
      reminderData = {
        type: 'flexible',
        flexiblePeriod: 'next_week',
        scheduledAt: target.iso,
        reminderStatus: 'waiting',
      };
    } else if (preset === 'tomorrow' || preset === 'tonight') {
      scheduledDate = calculateDateFromPreset(preset);
      reminderData = {
        type: 'scheduled',
        scheduledAt: scheduledDate || undefined,
        reminderStatus: 'waiting',
      };
    } else {
      scheduledDate = null;
      reminderData = {
        type: 'none',
        reminderStatus: 'waiting',
      };
    }

    const nowIso = new Date().toISOString();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const isPostponing = Boolean(it.reminderTime || it.scheduledFor || it.reminder?.scheduledAt);
        const newPostponeCount = isPostponing ? (it.postponeCount || 0) + 1 : (it.postponeCount || 0);
        const newPostponedAt = isPostponing ? [...(it.postponedAt || []), nowIso] : (it.postponedAt || []);

        return {
          ...it,
          scheduledFor: scheduledDate,
          reminderTime: scheduledDate,
          schedulePreset: preset,
          reminder: reminderData,
          postponeCount: newPostponeCount,
          postponedAt: newPostponedAt,
          lastPostponedAt: isPostponing ? nowIso : it.lastPostponedAt,
          isDone: false,
        };
      })
    );

    if (selectedItem?.id === id) {
      setSelectedItem((curr) => {
        if (!curr) return null;
        const isPostponing = Boolean(curr.reminderTime || curr.scheduledFor || curr.reminder?.scheduledAt);
        return {
          ...curr,
          scheduledFor: scheduledDate,
          reminderTime: scheduledDate,
          schedulePreset: preset,
          reminder: reminderData,
          postponeCount: isPostponing ? (curr.postponeCount || 0) + 1 : (curr.postponeCount || 0),
          postponedAt: isPostponing ? [...(curr.postponedAt || []), nowIso] : (curr.postponedAt || []),
          lastPostponedAt: isPostponing ? nowIso : curr.lastPostponedAt,
          isDone: false,
        };
      });
    }

    if (user?.uid) {
      writeFirestoreDoc(id, {
        scheduledFor: scheduledDate,
        reminderTime: scheduledDate,
        schedulePreset: preset,
        reminder: reminderData,
        isDone: false,
      });
    }

    showToast(scheduledDate ? `Rescheduled to ${formatReminderTime(scheduledDate)}` : 'Moved to someday');
  };

  // 3b. Dedicated Reschedule for "Not now" flow (preserves same memory id, resets reminder status to waiting)
  const rescheduleItem = (id: string, isoTimestamp: string) => {
    sounds.playTap();
    requestNotificationPermissionIfNeeded().then((granted) => {
      if (!granted && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
        showToast('Notifications are blocked — enable in Settings to receive alerts');
      }
    });
    const nowIso = new Date().toISOString();

    const reminderData: ItemReminder = {
      type: 'scheduled',
      scheduledAt: isoTimestamp,
      reminderStatus: 'waiting',
      notifiedAt: undefined,
    };

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newPostponeCount = (it.postponeCount || 0) + 1;
        const newPostponedAt = [...(it.postponedAt || []), nowIso];

        return {
          ...it,
          reminder: reminderData,
          scheduledFor: isoTimestamp,
          reminderTime: isoTimestamp,
          schedulePreset: 'custom',
          postponeCount: newPostponeCount,
          postponedAt: newPostponedAt,
          lastPostponedAt: nowIso,
          isDone: false,
          completedAt: undefined,
        };
      })
    );

    if (selectedItem?.id === id) {
      setSelectedItem((curr) => {
        if (!curr) return null;
        return {
          ...curr,
          reminder: reminderData,
          scheduledFor: isoTimestamp,
          reminderTime: isoTimestamp,
          schedulePreset: 'custom',
          postponeCount: (curr.postponeCount || 0) + 1,
          postponedAt: [...(curr.postponedAt || []), nowIso],
          lastPostponedAt: nowIso,
          isDone: false,
          completedAt: undefined,
        };
      });
    }

    if (user?.uid) {
      writeFirestoreDoc(id, {
        reminder: reminderData,
        scheduledFor: isoTimestamp,
        reminderTime: isoTimestamp,
        schedulePreset: 'custom',
        isDone: false,
        completedAt: undefined,
      });
    }

    showToast(`Rescheduled · ${formatReminderTime(isoTimestamp)}`);
  };

  // 4. Mark Done
  const toggleDone = (id: string) => {
    sounds.playTap();
    const nowIso = new Date().toISOString();
    let updatedNextDone = false;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextDone = !it.isDone;
          updatedNextDone = nextDone;
          return {
            ...it,
            isDone: nextDone,
            completedAt: nextDone ? (it.completedAt || nowIso) : undefined,
          };
        }
        return it;
      })
    );
    if (selectedItem?.id === id) {
      setSelectedItem((curr) => {
        if (!curr) return null;
        const nextDone = !curr.isDone;
        return {
          ...curr,
          isDone: nextDone,
          completedAt: nextDone ? (curr.completedAt || nowIso) : undefined,
        };
      });
    }

    if (user?.uid) {
      writeFirestoreDoc(id, {
        isDone: updatedNextDone,
        completedAt: updatedNextDone ? nowIso : undefined,
      });
    }
  };

  // 5. Archive
  const archiveItem = (id: string) => {
    sounds.playLetGoWhoosh();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isArchived: true } : it))
    );
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    if (user?.uid) {
      writeFirestoreDoc(id, { isArchived: true });
    }
    showToast('Archived');
  };

  // 6. Delete
  const deleteItem = (id: string) => {
    sounds.playTap();
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    if (user?.uid) {
      deleteFirestoreDoc(id);
    }
    showToast('Deleted');
  };

  // 6b. Set / Edit Urgency Tag
  const setItemUrgency = (id: string, tag: UrgencyTag | null) => {
    sounds.playTap();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          urgencyTag: tag || undefined,
          urgency: tag || undefined,
        };
      })
    );
    if (selectedItem?.id === id) {
      setSelectedItem((curr) => {
        if (!curr) return null;
        return {
          ...curr,
          urgencyTag: tag || undefined,
          urgency: tag || undefined,
        };
      });
    }
    if (user?.uid) {
      writeFirestoreDoc(id, {
        urgencyTag: tag || undefined,
        urgency: tag || undefined,
      });
    }
  };

  // 6c. Update Item Text Content (title, summary, rawInput)
  const updateItemContent = (
    itemId: string,
    updates: { title?: string; summary?: string; rawInput?: string }
  ) => {
    sounds.playTap();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.summary !== undefined ? { summary: updates.summary } : {}),
          ...(updates.rawInput !== undefined ? { rawInput: updates.rawInput, rawContent: updates.rawInput } : {}),
        };
      })
    );
    if (selectedItem?.id === itemId) {
      setSelectedItem((curr) => {
        if (!curr) return null;
        return {
          ...curr,
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.summary !== undefined ? { summary: updates.summary } : {}),
          ...(updates.rawInput !== undefined ? { rawInput: updates.rawInput, rawContent: updates.rawInput } : {}),
        };
      });
    }
    if (user?.uid) {
      writeFirestoreDoc(itemId, {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.summary !== undefined ? { summary: updates.summary } : {}),
        ...(updates.rawInput !== undefined ? { rawInput: updates.rawInput, rawContent: updates.rawInput } : {}),
      });
    }
  };

  // 7. Open
  const openItem = (id: string) => {
    sounds.playTap();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if (item.extractedMeta?.phoneNumber) {
      window.location.href = `tel:${item.extractedMeta.phoneNumber.replace(/[^0-9+]/g, '')}`;
    } else {
      setSelectedItem(item);
    }
  };

  const resetData = async () => {
    sounds.playTap();
    const key = getStorageKey(user?.uid);
    localStorage.removeItem(key);
    if (!user) {
      const { updatedItems } = processAutoArchive(initialSampleItems);
      setItems(updatedItems);
      showToast('Sample memory restored');
    } else {
      setItems([]);
      showToast('Memories reset');
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'items'));
        const batch = writeBatch(db);
        snap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      } catch (err) {
        console.error('Firestore batch delete error:', err);
        showToast("Saved on this device — will sync when back online");
      }
    }
    setSelectedItem(null);
  };

  return (
    <LaterContext.Provider
      value={{
        items,
        isSyncing,
        activeSwipeView,
        setActiveSwipeView,
        viewMode,
        setViewMode,
        pendingItemForSchedule,
        setPendingItemForSchedule,
        saveItem,
        applyScheduleToPending,
        selectedItem,
        setSelectedItem,
        snoozeItem,
        rescheduleItem,
        setReminderForItem,
        toggleDone,
        archiveItem,
        deleteItem,
        setItemUrgency,
        updateItemContent,
        openItem,
        runAutoArchiveCheck,
        runReminderCheck,
        toastMessage,
        showToast,
        isSearchOpen,
        setIsSearchOpen,
        sharedPrefill,
        setSharedPrefill,
        isSharedLaunch,
        resetData,
      }}
    >
      {children}
    </LaterContext.Provider>
  );
};

export const useLater = (): LaterContextType => {
  const ctx = useContext(LaterContext);
  if (!ctx) throw new Error('useLater must be used within LaterProvider');
  return ctx;
};

function capitalize(str?: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
