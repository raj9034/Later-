import { SavedItem } from '../types';

/**
 * 24 Hours in milliseconds
 */
export const AUTO_ARCHIVE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export interface AutoArchiveResult {
  updatedItems: SavedItem[];
  archivedItemIds: string[];
}

/**
 * Checks all items and automatically marks any item as archived
 * if it has been marked as 'Done' or 'Complete' for 24 hours or more.
 */
export function processAutoArchive(items: SavedItem[], currentTimeMs = Date.now()): AutoArchiveResult {
  const archivedItemIds: string[] = [];

  const updatedItems = items.map((item) => {
    // Only check items that are completed/done and not already archived
    if (item.isDone && !item.isArchived) {
      const completedTime = item.completedAt
        ? new Date(item.completedAt).getTime()
        : new Date(item.createdAt).getTime();

      const elapsedMs = currentTimeMs - completedTime;

      if (elapsedMs >= AUTO_ARCHIVE_THRESHOLD_MS) {
        archivedItemIds.push(item.id);
        return {
          ...item,
          isArchived: true,
          archivedAt: new Date(currentTimeMs).toISOString(),
        };
      }
    }
    return item;
  });

  return {
    updatedItems,
    archivedItemIds,
  };
}

/**
 * Computes the remaining time before a done item is auto-archived.
 */
export function getAutoArchiveTimeRemaining(item: SavedItem, currentTimeMs = Date.now()): {
  hoursRemaining: number;
  minutesRemaining: number;
  isReadyForArchive: boolean;
  label: string;
} | null {
  if (!item.isDone || item.isArchived) return null;

  const completedTime = item.completedAt
    ? new Date(item.completedAt).getTime()
    : new Date(item.createdAt).getTime();

  const deadline = completedTime + AUTO_ARCHIVE_THRESHOLD_MS;
  const remainingMs = deadline - currentTimeMs;

  if (remainingMs <= 0) {
    return {
      hoursRemaining: 0,
      minutesRemaining: 0,
      isReadyForArchive: true,
      label: 'Archiving soon',
    };
  }

  const hoursRemaining = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  let label = '';
  if (hoursRemaining > 0) {
    label = `Auto-archives in ${hoursRemaining}h`;
  } else if (minutesRemaining > 0) {
    label = `Auto-archives in ${minutesRemaining}m`;
  } else {
    label = 'Auto-archives in <1m';
  }

  return {
    hoursRemaining,
    minutesRemaining,
    isReadyForArchive: false,
    label,
  };
}
