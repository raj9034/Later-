import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLater } from '../context/LaterContext';
import { SavedItem } from '../types';
import { formatReminderTime } from '../utils/timeScheduler';
import { useScrollIntoViewOnFocus } from '../utils/useScrollIntoViewOnFocus';
import {
  Search,
  X,
  ArrowLeft,
  Play,
  ExternalLink,
  Camera,
  FileText,
  Phone,
  MapPin,
  Check,
  Sparkles,
} from 'lucide-react';

interface UniversalRecallSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalRecallSearch: React.FC<UniversalRecallSearchProps> = ({
  isOpen,
  onClose,
}) => {
  const { items, setSelectedItem, openItem } = useLater();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFocusScroll = useScrollIntoViewOnFocus();

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Universal Search Filter across all fields
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const terms = trimmed.split(/\s+/).filter(Boolean);

    return items.filter((item) => {
      // Build searchable haystack
      const haystackParts: string[] = [
        item.title || '',
        item.summary || '',
        item.rawInput || '',
        item.rawContent || '',
        item.url || '',
        item.sourceDomain || '',
        item.contentType || '',
        item.type || '',
        item.intent || '',
        ...(item.topics || []),
        ...(item.places || []),
        ...(item.people || []),
        item.extractedMeta?.platform || '',
        item.extractedMeta?.personName || '',
        item.extractedMeta?.phoneNumber || '',
        item.extractedMeta?.address || '',
        item.extractedMeta?.price || '',
        item.extractedMeta?.timeHint || '',
      ];

      const fullHaystack = haystackParts.join(' ').toLowerCase();

      // All search terms must match somewhere in the item
      return terms.every((term) => fullHaystack.includes(term));
    });
  }, [items, query]);

  // Natural Action on result click
  const handleItemClick = (item: SavedItem) => {
    if (item.url && (item.contentType === 'video' || item.contentType === 'link' || item.contentType === 'article' || item.contentType === 'product')) {
      // Natural action for video / web link is opening it
      openItem(item.id);
    } else {
      // Natural action for note, screenshot, person, place, task is opening detail sheet
      setSelectedItem(item);
    }
    onClose();
  };

  const renderItemTypeIcon = (item: SavedItem) => {
    if (item.imageAttachment) {
      return (
        <div className="w-8 h-8 rounded-lg overflow-hidden glass-icon-square shrink-0">
          <img
            src={item.imageAttachment}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    const type = item.contentType || item.type;

    switch (type) {
      case 'video':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--destructive)] shrink-0">
            <Play className="w-3.5 h-3.5 fill-current" />
          </div>
        );
      case 'person':
      case 'phone_number':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
        );
      case 'place':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
        );
      case 'task':
      case 'event':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case 'link':
      case 'article':
      case 'product':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--accent)] shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        );
      case 'screenshot':
      case 'image':
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Camera className="w-3.5 h-3.5" />
          </div>
        );
      case 'note':
      case 'idea':
      default:
        return (
          <div className="w-8 h-8 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="universal-recall-search-overlay"
          className="search-atmosphere"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Multi-layer atmospheric grain texture */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.05]"
            style={{
              mixBlendMode: 'overlay',
              backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
              backgroundRepeat: 'repeat',
            }}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: [0, 0, 0.2, 1] } }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
            className="w-full max-w-xl flex flex-col flex-1 relative z-10"
          >
            {/* Search Header Container with Pill Input */}
            <div className="w-full px-4 sm:px-6 pt-4 pb-3">
              <div className="flex items-center gap-3 input-glass-pill px-4 py-2.5 relative">
                {/* Back/Close button */}
                <button
                  id="recall-search-back-btn"
                  type="button"
                  onClick={onClose}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-full hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.94] press-interactive"
                  title="Close search (Esc)"
                  aria-label="Close search"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Search Icon */}
                <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />

                {/* Input field */}
                <input
                  id="recall-search-input"
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={handleFocusScroll}
                  placeholder="Search your Later"
                  className="w-full bg-transparent type-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-body"
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* Clear button */}
                {query && (
                  <button
                    id="recall-search-clear-btn"
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-full transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.92] press-interactive"
                    title="Clear text"
                    aria-label="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results / Suggestion Body */}
            <div className="w-full flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {query.trim() ? (
                filteredItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-2 pb-1 type-label text-[var(--text-secondary)] font-body">
                      <span>
                        {filteredItems.length} {filteredItems.length === 1 ? 'match' : 'matches'}
                      </span>
                      <span>Tap to recall</span>
                    </div>

                    {filteredItems.map((item) => {
                      const reminderText = formatReminderTime(item.reminderTime || item.scheduledFor);
                      return (
                        <div
                          key={item.id}
                          id={`recall-result-${item.id}`}
                          onClick={() => handleItemClick(item)}
                          className="group relative flex items-center justify-between py-3.5 px-4 rounded-2xl glass-resting transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer select-none active:scale-[0.99] press-interactive"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            {renderItemTypeIcon(item)}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="type-body font-medium text-[var(--text-primary)] truncate min-w-0 flex-1 group-hover:text-[var(--text-primary)]">
                                  {item.title}
                                </p>
                                {item.intent && (
                                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full type-caption uppercase bg-[var(--surface-sunken)] text-[var(--text-tertiary)] border border-[var(--border)] shrink-0 whitespace-nowrap text-[10px] font-mono">
                                    {item.intent}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5 type-caption text-[var(--text-tertiary)] truncate min-w-0 font-body">
                                {item.sourceDomain && (
                                  <span className="text-[var(--text-secondary)]">{item.sourceDomain} ·</span>
                                )}
                                {item.places && item.places.length > 0 && (
                                  <span className="text-[var(--text-secondary)]">{item.places.join(', ')} ·</span>
                                )}
                                {item.people && item.people.length > 0 && (
                                  <span className="text-[var(--text-secondary)]">{item.people.join(', ')} ·</span>
                                )}
                                <span className="text-[var(--text-secondary)]">{reminderText}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Icon Hint */}
                          <div className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] p-1.5 rounded-lg transition-colors">
                            {item.url ? (
                              <ExternalLink className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty State */
                  <div
                    id="recall-search-empty-state"
                    className="py-16 flex flex-col items-center justify-center text-center px-4"
                  >
                    <div className="w-12 h-12 rounded-2xl glass-resting flex items-center justify-center text-[var(--text-secondary)] mb-3 shadow-xs">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="type-heading-md font-display font-semibold text-[var(--text-primary)] mb-1">
                      Nothing found yet
                    </h3>
                    <p className="type-body-sm text-[var(--text-secondary)] max-w-xs leading-relaxed font-body">
                      Try another word from what you remember.
                    </p>
                  </div>
                )
              ) : (
                /* Initial Guidance State */
                <div className="py-10 flex flex-col items-center text-center px-4">
                  <div className="w-12 h-12 rounded-2xl glass-resting flex items-center justify-center text-[var(--accent)] mb-3 shadow-xs">
                    <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <p className="type-body-sm text-[var(--text-secondary)] mb-5 max-w-xs font-body leading-relaxed">
                    Type any word you remember — a place, name, topic, note fragment, or website.
                  </p>

                  {/* Quick Keyword Example Suggestions */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm">
                    {['kyoto', 'woodworking', 'keyboard', 'design', 'arjun'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="px-3.5 py-1.5 rounded-full type-label font-body select-none transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-1.5 active:scale-[0.97] press-interactive glass-resting hover:border-[var(--accent)] hover:text-[var(--text-primary)] text-[var(--text-secondary)]"
                      >
                        "{term}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

