import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLater } from '../../context/LaterContext';
import { useAuth, ONBOARDING_STORAGE_KEY } from '../../context/AuthContext';
import { sounds } from '../../utils/audio';
import { HelpFaqModal } from './HelpFaqModal';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Compass, 
  CornerDownLeft, 
  HelpCircle,
  X 
} from 'lucide-react';

interface OnboardingModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ forceOpen = false, onClose }) => {
  const { saveItem, showToast, isSharedLaunch } = useLater();
  const { user, loading: authLoading, hasSeenOnboarding, markOnboardingComplete } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [step, setStep] = useState<'splash' | 'welcome' | 'core-loop' | 'interactive'>('splash');
  const [firstMemoryText, setFirstMemoryText] = useState<string>('Review project brief tomorrow 9am');

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setStep('welcome');
      return;
    }

    // If launched via Android Share Sheet, do not obstruct the user's capture workflow
    if (isSharedLaunch) {
      setIsOpen(false);
      return;
    }

    // Wait until auth initialization completes to avoid falsely showing onboarding
    if (authLoading) {
      return;
    }

    if (user) {
      // Authenticated user: check Firestore hasSeenOnboarding field first
      if (hasSeenOnboarding === true) {
        setIsOpen(false);
      } else if (hasSeenOnboarding === false) {
        setIsOpen(true);
        setStep('splash');
      }
      // If hasSeenOnboarding is null, the user doc is still being read from Firestore
    } else {
      // Guest mode: fall back to localStorage
      try {
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!completed) {
          setIsOpen(true);
          setStep('splash');
        } else {
          setIsOpen(false);
        }
      } catch {
        setIsOpen(true);
        setStep('splash');
      }
    }
  }, [forceOpen, authLoading, user, hasSeenOnboarding]);

  // Auto-advance splash after a brief, cinematic pause (~1.7s)
  useEffect(() => {
    if (isOpen && step === 'splash') {
      const timer = setTimeout(() => {
        setStep('welcome');
      }, 1750);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  const handleComplete = async (customClose?: boolean) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    await markOnboardingComplete();
    setIsOpen(false);
    sounds.playSaveChime();
    if (onClose) onClose();
  };

  const handleSaveFirstMemory = () => {
    if (firstMemoryText.trim()) {
      saveItem(firstMemoryText.trim());
      showToast('First memory captured and scheduled');
    }
    handleComplete();
  };

  if (!isOpen) return null;

  return (
    <div
      id="onboarding-overlay"
      className="onboarding-atmosphere"
    >
      {/* Multi-layer atmospheric grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.05]"
        style={{
          mixBlendMode: 'overlay',
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')`,
          backgroundRepeat: 'repeat',
        }}
        aria-hidden="true"
      />

      <div
        id="onboarding-container"
        className="w-full max-w-lg glass-onboarding-card elevation-4 overflow-hidden flex flex-col relative z-10"
      >
        {/* Top Right Controls (Need Help & Skip) */}
        {step !== 'splash' && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
            <button
              id="onboarding-help-faq-btn"
              type="button"
              onClick={() => {
                sounds.playTap();
                setIsFaqOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-1.5 active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)]"
              title="Need help? How Later Works & FAQ"
              aria-label="Need help? How Later Works & FAQ"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
              <span>Need help?</span>
            </button>

            <button
              id="onboarding-skip-btn"
              type="button"
              onClick={() => handleComplete(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-1.5 active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)]"
            >
              <span>Skip</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Brief Opening Splash */}
          {step === 'splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] } }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
              id="onboarding-splash-step"
              onClick={() => setStep('welcome')}
              className="p-12 flex flex-col items-center justify-center text-center cursor-pointer min-h-[380px] relative overflow-hidden select-none"
            >
              {/* Central Glowing Orb with Radiating Sparkle Particles */}
              <div className="relative mb-7 flex items-center justify-center">
                {/* Outward drifting sparkle / glow particles */}
                {[
                  { x: -28, y: -24, delay: 0.1, size: 4 },
                  { x: 26, y: -22, delay: 0.25, size: 3.5 },
                  { x: 30, y: 18, delay: 0.4, size: 4 },
                  { x: -26, y: 22, delay: 0.3, size: 3 },
                  { x: 0, y: -34, delay: 0.15, size: 3 },
                  { x: 0, y: 34, delay: 0.35, size: 3.5 },
                ].map((pt, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 0.9, 0],
                      scale: [0.2, 1.2, 0.4],
                      x: pt.x,
                      y: pt.y,
                    }}
                    transition={{
                      duration: 1.4,
                      delay: pt.delay,
                      repeat: Infinity,
                      repeatDelay: 0.2,
                      ease: 'easeOut',
                    }}
                    style={{
                      width: `${pt.size}px`,
                      height: `${pt.size}px`,
                    }}
                    className="absolute rounded-full bg-[var(--accent-gold)] pointer-events-none shadow-[0_0_8px_rgba(232,200,122,0.8)]"
                  />
                ))}

                {/* Outer pulsing ring glow */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -inset-2 rounded-3xl bg-[var(--accent-gold)]/15 blur-md pointer-events-none"
                />

                {/* Orb Container */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-16 h-16 rounded-2xl glass-elevated flex items-center justify-center elevation-2 relative z-10 border border-[var(--border)]"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        '0 0 14px rgba(232,200,122,0.4)',
                        '0 0 24px rgba(232,200,122,0.8)',
                        '0 0 14px rgba(232,200,122,0.4)',
                      ],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-4 h-4 rounded-full bg-[var(--accent-gold)]"
                  />
                </motion.div>
              </div>

              {/* Staggered Wordmark (~300ms after orb) */}
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl font-display font-bold tracking-tight text-[var(--text-primary)] mb-2"
              >
                Later
              </motion.h1>

              {/* Staggered Subtitle (~200ms after wordmark -> ~500ms delay) */}
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="type-label uppercase tracking-widest text-[var(--text-secondary)]"
              >
                Quiet External Memory
              </motion.p>
            </motion.div>
          )}

          {/* STEP 1: Welcome & Value Proposition */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              id="onboarding-welcome-step"
              className="p-6 sm:p-8 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl glass-icon-square flex items-center justify-center text-[var(--accent-gold)]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="type-label uppercase tracking-widest text-[var(--accent-gold)] font-semibold font-body">
                  Welcome to Later
                </span>
              </div>

              <h2 className="type-heading-lg text-xl sm:text-2xl font-display font-bold tracking-tight text-[var(--text-primary)] leading-tight mb-3">
                Later remembers things for you and brings them back when they matter.
              </h2>

              <p className="type-body text-[var(--text-secondary)] leading-relaxed mb-6 font-body">
                Free your mental bandwidth. Whenever you come across an article, a quick thought, a reminder, or a task you cannot deal with right now, drop it here and let Later handle the timing.
              </p>

              <div className="p-4 rounded-2xl glass-resting border border-[var(--border-subtle)] mb-6 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl glass-icon-square flex items-center justify-center text-[var(--success)] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="type-body-sm">
                  <p className="text-[var(--text-primary)] font-medium mb-0.5">Natural Intelligence</p>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Type naturally like <span className="text-[var(--text-primary)] font-mono font-medium">"Pay bill next Monday 9am"</span> — Later understands the context and schedules it automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
                {/* Progress Dots */}
                <div className="flex items-center gap-1.5" aria-label="Step 1 of 3">
                  <span className="w-5 h-2 rounded-full bg-[var(--accent)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] shadow-[0_0_8px_var(--accent)]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--border)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--border)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]" />
                </div>

                <button
                  id="onboarding-welcome-next-btn"
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setStep('core-loop');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-white type-button font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.97] press-interactive"
                >
                  <span>How it works</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: The Core 3-Step Loop */}
          {step === 'core-loop' && (
            <motion.div
              key="core-loop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              id="onboarding-loop-step"
              className="p-6 sm:p-8 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl glass-icon-square flex items-center justify-center text-[var(--accent-gold)]">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="type-label uppercase tracking-widest text-[var(--accent-gold)] font-semibold font-body">
                  The Core Loop
                </span>
              </div>

              <h2 className="type-heading-lg text-xl sm:text-2xl font-display font-bold tracking-tight text-[var(--text-primary)] leading-tight mb-4">
                Three simple moments
              </h2>

              <div className="space-y-3 mb-6">
                {/* Item 1 */}
                <div className="p-3.5 rounded-2xl glass-resting border border-[var(--border-subtle)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg glass-icon-square flex items-center justify-center text-[var(--text-primary)] text-xs font-mono font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] font-body">Save something</h3>
                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed font-body">
                      Paste a link, jot a thought, attach an image, or capture from your clipboard in one clean action.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-3.5 rounded-2xl glass-resting border border-[var(--border-subtle)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg glass-icon-square flex items-center justify-center text-[var(--accent)] text-xs font-mono font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] font-body">Tell Later when it matters</h3>
                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed font-body">
                      Type a date/time or select a preset: <span className="text-[var(--accent)] font-mono">Tonight</span>, <span className="text-[var(--accent)] font-mono">Tomorrow</span>, or <span className="text-[var(--accent)] font-mono">Next Week</span>.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="p-3.5 rounded-2xl glass-resting border border-[var(--border-subtle)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg glass-icon-square flex items-center justify-center text-[var(--success)] text-xs font-mono font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] font-body">Later brings it back when you need it</h3>
                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed font-body">
                      Items surface in your priority stream right on cue, complete with contextual tags and related memories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
                {/* Progress Dots */}
                <div className="flex items-center gap-1.5" aria-label="Step 2 of 3">
                  <span className="w-2 h-2 rounded-full bg-[var(--border)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]" />
                  <span className="w-5 h-2 rounded-full bg-[var(--accent)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] shadow-[0_0_8px_var(--accent)]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--border)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('welcome')}
                    className="px-3.5 py-2 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)] type-body-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    id="onboarding-loop-next-btn"
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setStep('interactive');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-white type-button font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.97] press-interactive"
                  >
                    <span>Try it now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Guided First Interaction */}
          {step === 'interactive' && (
            <motion.div
              key="interactive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              id="onboarding-try-step"
              className="p-6 sm:p-8 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl glass-icon-square flex items-center justify-center text-[var(--accent-gold)]">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="type-label uppercase tracking-widest text-[var(--accent-gold)] font-semibold font-body">
                  First Memory
                </span>
              </div>

              <h2 className="type-heading-lg text-xl sm:text-2xl font-display font-bold tracking-tight text-[var(--text-primary)] leading-tight mb-2">
                Try remembering something right now
              </h2>
              <p className="type-body-sm text-[var(--text-secondary)] mb-4 font-body">
                Edit this example or choose an inspiration below:
              </p>

              {/* Interactive Input Box */}
              <div className="p-3.5 glass-resting border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)] rounded-2xl mb-3.5 transition-all">
                <input
                  id="onboarding-first-memory-input"
                  type="text"
                  value={firstMemoryText}
                  onChange={(e) => setFirstMemoryText(e.target.value)}
                  placeholder="What do you want to remember later?"
                  className="w-full bg-transparent type-body text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none font-body"
                />
              </div>

              {/* Quick Inspiration Chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'Read architecture article tonight 8pm',
                  'Call electrician on Friday morning',
                  'Buy flight tickets next weekend',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setFirstMemoryText(suggestion);
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium font-body bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive shadow-xs truncate max-w-full"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
                {/* Progress Dots */}
                <div className="flex items-center gap-1.5" aria-label="Step 3 of 3">
                  <span className="w-2 h-2 rounded-full bg-[var(--border)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--border)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]" />
                  <span className="w-5 h-2 rounded-full bg-[var(--accent)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] shadow-[0_0_8px_var(--accent)]" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleComplete(true)}
                    className="px-3.5 py-2 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)] type-body-sm font-medium"
                  >
                    I'll start empty
                  </button>
                  <button
                    id="onboarding-save-first-memory-btn"
                    type="button"
                    onClick={handleSaveFirstMemory}
                    className="px-4 py-2.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-white type-button font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.97] press-interactive"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>Save & Enter</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAQ / Help Modal Overlay on top of Onboarding */}
      <HelpFaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />
    </div>
  );
};
