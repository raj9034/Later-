import React from 'react';
import { Home, Search, CalendarDays, UserRound } from 'lucide-react';

export type BottomNavTab = 'home' | 'search' | 'schedule' | 'profile';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onChange: (tab: BottomNavTab) => void;
}

interface TabConfig {
  id: BottomNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

/**
 * Persistent bottom navigation — the primary way to move between Later's
 * main sections. Respects Android gesture-nav / safe-area insets, works in
 * both themes via the shared glass-elevated surface tokens, and shows a
 * clear, animated active-state indicator (no ambiguity about current tab).
 */
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  return (
    <nav
      id="bottom-nav"
      role="tablist"
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--divider)] bg-[var(--surface)]/92 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="w-full max-w-xl mx-auto flex items-stretch justify-around px-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`bottom-nav-${id}-btn`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => onChange(id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset"
            >
              {/* Active pill background */}
              <span
                className={`absolute top-1 left-1/2 -translate-x-1/2 w-11 h-7 rounded-full transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
                  isActive
                    ? 'bg-[var(--accent-soft)] scale-100 opacity-100'
                    : 'scale-75 opacity-0'
                }`}
              />
              <Icon
                className={`relative w-[22px] h-[22px] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                  isActive
                    ? 'text-[var(--accent)] scale-105'
                    : 'text-[var(--text-tertiary)]'
                }`}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={`relative type-caption transition-colors duration-[var(--duration-fast)] ${
                  isActive
                    ? 'text-[var(--accent)] font-bold'
                    : 'text-[var(--text-tertiary)] font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
