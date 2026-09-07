import React, { useRef } from 'react';
import { useLater } from '../context/LaterContext';
import { getTimeBucket } from '../utils/timeScheduler';
import { SavedItem, SwipeView, TimeBucket } from '../types';
import { TimelineItemRow } from './TimelineItemRow';
import { MemoryMoment } from './MemoryMoment';
import { WhatShouldIDealWith } from './WhatShouldIDealWith';
import { SystemState } from './ui/SystemState';
import { motion, AnimatePresence } from 'motion/react';

const ORDERED_BUCKETS: TimeBucket[] = [
  'NOW',
  'TODAY',
  'TONIGHT',
  'TOMORROW',
  'THIS WEEK',
  'LATER',
];

const SWIPE_ORDER: SwipeView[] = [
  'ALL',
  'LINKS',
  'SCREENSHOTS',
  'NOTES',
  'TASKS',
  'PEOPLE',
  'PLACES',
];

export const TimelineList: React.FC = () => {
  const { items, activeSwipeView, setActiveSwipeView, isSyncing } = useLater();
  const touchStartX = useRef<number | null>(null);

  // Filter unarchived items according to active swipe view
  const filteredItems = items.filter((item) => {
    if (item.isArchived) return false;
    if (activeSwipeView === 'ALL') return true;

    const t = item.contentType || item.type;
    if (activeSwipeView === 'LINKS')
      return t === 'link' || t === 'video' || t === 'product' || t === 'article';
    if (activeSwipeView === 'SCREENSHOTS')
      return t === 'screenshot' || t === 'image';
    if (activeSwipeView === 'NOTES')
      return t === 'note' || t === 'idea';
    if (activeSwipeView === 'TASKS')
      return t === 'task' || t === 'event';
    if (activeSwipeView === 'PEOPLE')
      return t === 'person' || t === 'phone_number';
    if (activeSwipeView === 'PLACES')
      return t === 'place';
    return true;
  });

  // Group items by time bucket
  const grouped: Record<TimeBucket, SavedItem[]> = {
    NOW: [],
    TODAY: [],
    TONIGHT: [],
    TOMORROW: [],
    'THIS WEEK': [],
    LATER: [],
  };

  filteredItems.forEach((item) => {
    const bucket = getTimeBucket(item.reminderTime || item.scheduledFor);
    grouped[bucket].push(item);
  });

  // Handle horizontal swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(diff) > 50) {
      const currentIndex = SWIPE_ORDER.indexOf(activeSwipeView);
      if (diff < 0 && currentIndex < SWIPE_ORDER.length - 1) {
        // Swiped left -> next view
        setActiveSwipeView(SWIPE_ORDER[currentIndex + 1]);
      } else if (diff > 0 && currentIndex > 0) {
        // Swiped right -> previous view
        setActiveSwipeView(SWIPE_ORDER[currentIndex - 1]);
      }
    }
  };

  if (isSyncing) {
    return (
      <div className="w-full pt-2 pb-16">
        <SystemState
          type="loading"
          className="later-skeleton"
          title="Loading your memories…"
          description="Syncing your personal memory bank…"
        />
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full pt-2 pb-16 space-y-4"
    >
      {/* Surfaced Priority Sections — wrapped with tight 16px vertical gap (--space-4) */}
      {activeSwipeView === 'ALL' && (
        <div className="space-y-4">
          <MemoryMoment />
          <WhatShouldIDealWith />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSwipeView}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-5"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12">
              <p className="text-sm font-medium text-[var(--text-secondary)] text-center">Nothing saved here yet</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono text-center">
                Capture links, notes, screenshots, or places above
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {ORDERED_BUCKETS.map((bucket) => {
                const bucketItems = grouped[bucket];
                if (bucketItems.length === 0) return null;

                return (
                  <motion.div
                    key={bucket}
                    layout="position"
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      overflow: 'hidden',
                      transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                    }}
                    className="space-y-3"
                  >
                    {/* Sticky Bucket Header */}
                    <div
                      className="sticky z-10 flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-resting)]/90 backdrop-blur-md border border-[var(--border-subtle)]/60 shadow-2xs transition-colors"
                      style={{
                        top: 'calc(var(--header-height, 56px) + var(--capture-bar-height, 108px) + 8px)',
                      }}
                    >
                      <span
                        className={`type-label ${
                          bucket === 'NOW'
                            ? 'text-[var(--accent)]'
                            : bucket === 'TODAY' || bucket === 'TONIGHT'
                            ? 'text-[var(--text-primary)]'
                            : 'text-[var(--text-tertiary)]'
                        }`}
                      >
                        {bucket}
                      </span>
                      <div className="h-px flex-1 bg-[var(--divider)]" />
                      <span className="type-caption text-[var(--text-tertiary)]">
                        {bucketItems.length}
                      </span>
                    </div>

                    {/* List of items */}
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {bucketItems.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            layout="position"
                            initial={{ opacity: 1, height: 'auto' }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              marginTop: 0,
                              marginBottom: 0,
                              overflow: 'hidden',
                              transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                            }}
                          >
                            <TimelineItemRow item={item} index={idx} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
