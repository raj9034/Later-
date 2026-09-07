import React from 'react';
import { SavedItem } from '../types';
import { useLater } from '../context/LaterContext';
import { MemoryCard } from './ui/MemoryCard';

interface TimelineItemRowProps {
  item: SavedItem;
  index?: number;
}

export const TimelineItemRow: React.FC<TimelineItemRowProps> = ({ item, index }) => {
  const { setSelectedItem, toggleDone, snoozeItem, archiveItem } = useLater();

  return (
    <MemoryCard
      item={item}
      staggerIndex={index}
      onClick={() => setSelectedItem(item)}
      onToggleDone={toggleDone}
      onSnooze={snoozeItem}
      onArchive={archiveItem}
    />
  );
};
