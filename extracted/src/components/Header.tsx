import React, { useEffect } from 'react';
import { useLater } from '../context/LaterContext';

interface HeaderProps {
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
  onOpenOnboarding?: () => void;
  onReplayTour?: () => void;
}

/**
 * Minimal top header — just brand identity and live status. Search, theme,
 * schedule, and account controls all now live in the persistent bottom
 * navigation (Home / Search / Schedule / Profile), so the header no longer
 * needs to carry five separate icon buttons. Keyboard shortcuts (⌘K, /)
 * still route through here since they have no natural home in a bottom
 * nav, but visually the header stays quiet and confident.
 */
export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { items, setIsSearchOpen } = useLater();

  const activeCount = items.filter((i) => !i.isArchived && !i.isDone).length;

  const handleOpenSearch = () => {
    if (onOpenSearch) onOpenSearch();
    setIsSearchOpen(true);
  };

  // Keyboard shortcut listener (Cmd+K or Ctrl+K or /) — preserved from the
  // previous header implementation; still the fastest way to search on a
  // physical keyboard even though Search also lives in the bottom nav.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenSearch();
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleOpenSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--divider)] h-14 px-4 sm:px-6 flex items-center transition-colors duration-200">
      <div className="w-full max-w-xl mx-auto flex items-baseline gap-2.5">
        <h1 className="type-heading-lg text-[var(--text-primary)] tracking-tight">
          Later
        </h1>
        <span className="type-meta text-[var(--text-tertiary)]">
          {activeCount === 0 ? 'empty' : `${activeCount} in memory`}
        </span>
      </div>
    </header>
  );
};
