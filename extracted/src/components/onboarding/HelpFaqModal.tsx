import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Circle as HelpCircle, ChevronDown, Sparkles, Clock, Layers, RotateCw, ShieldCheck, Compass } from 'lucide-react';

interface HelpFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTutorial?: () => void;
  onReplayTour?: () => void;
}

interface FaqItem {
  id: string;
  question: string;
  icon: React.ReactNode;
  answer: string;
  tip?: string;
}

export const HelpFaqModal: React.FC<HelpFaqModalProps> = ({ isOpen, onClose, onOpenTutorial, onReplayTour }) => {
  const [expandedId, setExpandedId] = useState<string | null>('what-is-later');

  if (!isOpen) return null;

  const faqs: FaqItem[] = [
    {
      id: 'what-is-later',
      question: 'What is Later?',
      icon: <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />,
      answer: 'Later is your quiet external memory. It relieves cognitive overload by holding onto thoughts, articles, tasks, and inspirations until the exact moment you are ready to deal with them.',
      tip: 'Remember now, deal with it Later.',
    },
    {
      id: 'what-can-i-save',
      question: 'What kinds of things can Later remember?',
      icon: <Layers className="w-4 h-4 text-[var(--text-primary)]" />,
      answer: 'You can capture almost anything: quick text notes, web articles & URLs, screenshots & photo references, to-dos, place recommendations, and contacts.',
      tip: 'Tip: Use the Instant Capture Orb at the bottom right to paste your clipboard from other apps with one tap.',
    },
    {
      id: 'how-scheduling-works',
      question: 'How does natural time scheduling work?',
      icon: <Clock className="w-4 h-4 text-[var(--accent)]" />,
      answer: 'Just type natural language expressions directly into your note, like "Read paper tomorrow 8pm", "Call dentist in 3 days", or "Trip ideas next month". Later automatically parses the time.',
      tip: 'You can also tap preset buttons (Tonight, Tomorrow, Next Week, Someday) or pick a custom date/time anytime.',
    },
    {
      id: 'how-resurfacing-works',
      question: 'How does resurfacing & memory recall work?',
      icon: <RotateCw className="w-4 h-4 text-[var(--success)]" />,
      answer: 'When an item’s scheduled time arrives, Later resurfaces it at the top of your timeline in "Memory Moments" and "What Should I Deal With". You can complete it, open links, or snooze it to a better time with "Not Now".',
    },
    {
      id: 'account-privacy',
      question: 'How does account storage & privacy work?',
      icon: <ShieldCheck className="w-4 h-4 text-[var(--text-secondary)]" />,
      answer: 'You can use Later immediately as a guest. When you want your memories securely isolated across devices, create a free account with email & password in the top header.',
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div
      id="help-faq-overlay"
      className="fixed inset-0 z-[60] sheet-backdrop flex items-center justify-center p-4 text-[var(--text-primary)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        id="help-faq-modal"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } }}
        exit={{ opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
        className="w-full max-w-lg glass-detail-sheet rounded-3xl elevation-4 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--divider)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl glass-icon-square flex items-center justify-center text-[var(--accent-gold)] shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="type-display text-lg font-bold tracking-tight text-[var(--text-primary)] font-display">
                How Later Works & FAQ
              </h2>
              <p className="type-body-sm text-[var(--text-secondary)] font-body">
                Quick guide to your external memory
              </p>
            </div>
          </div>
          <button
            id="close-help-faq-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)]"
            aria-label="Close Help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content FAQ Accordion */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {faqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className={`rounded-2xl transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] overflow-hidden ${
                  isExpanded
                    ? 'glass-elevated border border-[var(--border)]'
                    : 'glass-resting border border-[var(--border-subtle)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 pr-2">
                    <div className="shrink-0">{faq.icon}</div>
                    <span className="type-heading-lg text-xs sm:text-sm font-semibold text-[var(--text-primary)] font-body">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-tertiary)] shrink-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
                      isExpanded ? 'rotate-180 text-[var(--accent)]' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--divider)] font-body">
                    <p className="mb-2.5">{faq.answer}</p>
                    {faq.tip && (
                      <div className="p-3 rounded-xl glass-resting border border-[var(--border-subtle)] text-xs text-[var(--accent-gold)] font-mono">
                        {faq.tip}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with Re-play Tutorial Trigger */}
        <div className="px-6 py-4 border-t border-[var(--divider)] glass-resting flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenTutorial && (
              <button
                id="replay-onboarding-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTutorial();
                }}
                className="px-3 py-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1.5 cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] active:scale-[0.97] press-interactive"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Replay welcome intro</span>
              </button>
            )}

            {onReplayTour && (
              <button
                id="replay-feature-tour-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onReplayTour();
                }}
                className="px-3 py-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-gold)] flex items-center gap-1.5 cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] active:scale-[0.97] press-interactive"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                <span>Replay feature tour</span>
              </button>
            )}
          </div>

          <button
            id="done-help-faq-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer shadow-xs active:scale-[0.97] press-interactive shrink-0"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
};
