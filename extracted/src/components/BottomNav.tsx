import React from 'react';
import { Hop as Home, Calendar, Search, Plus, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export type NavTab = 'home' | 'schedule' | 'search' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onCapturePress: () => void;
}

interface TabConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
];

const TABS_RIGHT: TabConfig[] = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

/**
 * Persistent bottom navigation, styled consistently with Later's existing
 * glass/elevation design tokens. Respects safe-area insets for Android
 * gesture bars. The center capture button is visually elevated above the
 * bar itself, matching the "primary action" pattern used by Instagram/YouTube.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onCapturePress,
}) => {
  const renderTab = (tab: TabConfig) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        id={`bottom-nav-${tab.id}-btn`}
        onClick={() => onSelectTab(tab.id)}
        className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer outline-none group"
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && (
          <motion.div
            layoutId="bottom-nav-active-pill"
            className="absolute top-1 w-9 h-9 rounded-2xl bg-[var(--accent-soft)]"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <Icon
          className={`w-[21px] h-[21px] relative z-10 transition-colors duration-150 ${
            isActive
              ? 'text-[var(--accent)]'
              : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
          }`}
          strokeWidth={isActive ? 2.3 : 1.8}
        />
        <span
          className={`relative z-10 text-[10px] leading-none transition-colors duration-150 ${
            isActive
              ? 'text-[var(--accent)] font-semibold'
              : 'text-[var(--text-tertiary)] font-medium group-hover:text-[var(--text-secondary)]'
          }`}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav
      id="bottom-nav"
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="w-full max-w-xl mx-auto px-4 pb-2 pointer-events-auto">
        <div
          className="relative flex items-stretch h-[60px] rounded-[28px] border border-[var(--border)] elevation-3"
          style={{
            background:
              'color-mix(in srgb, var(--surface-elevated) 92%, transparent)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {TABS.map(renderTab)}

          {/* Center elevated Capture button */}
          <div className="relative flex-1 flex items-center justify-center">
            <button
              type="button"
              id="bottom-nav-capture-btn"
              onClick={onCapturePress}
              aria-label="Capture a new memory"
              className="absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center bg-[var(--accent)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] cursor-pointer active:scale-[0.94] press-interactive transition-transform outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
              style={{
                boxShadow:
                  '0 10px 28px rgba(var(--glow-accent-rgb, 181,132,255), 0.35), 0 4px 12px rgba(0,0,0,0.25)',
              }}
            >
              <Plus className="w-6 h-6" strokeWidth={2.4} />
            </button>
          </div>

          {TABS_RIGHT.map(renderTab)}
        </div>
      </div>
    </nav>
  );
};
