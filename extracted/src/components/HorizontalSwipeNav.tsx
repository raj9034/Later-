import React from 'react';
import { useLater } from '../context/LaterContext';
import { SwipeView } from '../types';
import { FilterChip } from './ui/FilterChip';

const VIEWS: SwipeView[] = [
  'ALL',
  'LINKS',
  'SCREENSHOTS',
  'NOTES',
  'TASKS',
  'PEOPLE',
  'PLACES',
];

const VIEW_LABELS: Partial<Record<SwipeView, string>> = {
  ALL: 'All',
  LINKS: 'Links',
  SCREENSHOTS: 'Screenshots',
  NOTES: 'Notes',
  TASKS: 'Tasks',
  PEOPLE: 'People',
  PLACES: 'Places',
};

export const HorizontalSwipeNav: React.FC = () => {
  const { activeSwipeView, setActiveSwipeView, items } = useLater();

  const getCountForView = (view: SwipeView): number => {
    const unarchived = items.filter((i) => !i.isArchived);
    if (view === 'ALL') return unarchived.length;
    if (view === 'LINKS')
      return unarchived.filter((i) => {
        const t = i.contentType || i.type;
        return t === 'link' || t === 'video' || t === 'product' || t === 'article';
      }).length;
    if (view === 'SCREENSHOTS')
      return unarchived.filter((i) => {
        const t = i.contentType || i.type;
        return t === 'screenshot' || t === 'image';
      }).length;
    if (view === 'NOTES')
      return unarchived.filter((i) => {
        const t = i.contentType || i.type;
        return t === 'note' || t === 'idea';
      }).length;
    if (view === 'TASKS')
      return unarchived.filter((i) => {
        const t = i.contentType || i.type;
        return t === 'task' || t === 'event';
      }).length;
    if (view === 'PEOPLE')
      return unarchived.filter((i) => {
        const t = i.contentType || i.type;
        return t === 'person' || t === 'phone_number';
      }).length;
    if (view === 'PLACES')
      return unarchived.filter((i) => {
        const t = i.contentType || i.type;
        return t === 'place';
      }).length;
    return 0;
  };

  return (
    <div id="horizontal-swipe-nav-container" className="w-full overflow-x-auto no-scrollbar py-2.5 border-b border-[var(--divider)]">
      <div className="flex items-center gap-1.5 px-0.5 min-w-max">
        {VIEWS.map((view) => {
          const isActive = activeSwipeView === view;
          const count = getCountForView(view);

          return (
            <FilterChip
              key={view}
              id={`swipe-view-tab-${view.toLowerCase()}`}
              label={VIEW_LABELS[view] || view}
              count={count}
              isActive={isActive}
              onClick={() => setActiveSwipeView(view)}
            />
          );
        })}
      </div>
    </div>
  );
};

