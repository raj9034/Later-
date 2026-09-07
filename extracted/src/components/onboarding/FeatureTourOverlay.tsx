import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface TourStep {
  id: string;
  targetId: string;
  fallbackTargetId?: string;
  title: string;
  description: string;
  positionPreference?: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'step-capture',
    targetId: 'universal-capture-container',
    title: 'Fast Universal Capture',
    description: 'Capture any thought, link, or note instantly without worrying about organizing it first.',
    positionPreference: 'bottom',
  },
  {
    id: 'step-priority',
    targetId: 'capture-priority-chips-group',
    fallbackTargetId: 'capture-tag-urgent-btn',
    title: 'Priority & Urgency Tags',
    description: 'Label tasks as Priority, Important, or Chill to ensure the right memories resurface when needed.',
    positionPreference: 'bottom',
  },
  {
    id: 'step-time',
    targetId: 'capture-set-time-btn',
    title: 'When To Bring Back',
    description: 'Deconstruct deadline anxiety with soft reminder horizons like Tonight, Tomorrow, or This Weekend.',
    positionPreference: 'bottom',
  },
  {
    id: 'step-search',
    targetId: 'bottom-nav-search-btn',
    title: 'Universal Recall Search',
    description: 'Tap Search anytime (or hit ⌘K) to filter memories instantly by title, notes, or priority.',
    positionPreference: 'top',
  },
  {
    id: 'step-schedule',
    targetId: 'bottom-nav-schedule-btn',
    title: 'Timeline & Schedule Views',
    description: 'Toggle effortlessly between your grouped external memory stream and an agenda calendar view.',
    positionPreference: 'top',
  },
  {
    id: 'step-account',
    targetId: 'bottom-nav-profile-btn',
    title: 'Profile, Themes & Options',
    description: 'Manage cloud sync, switch between Soft Cloud light mode and Dark Luxury, or replay guides.',
    positionPreference: 'top',
  },
  {
    id: 'step-surfacing',
    targetId: 'what-should-i-deal-with-section',
    fallbackTargetId: 'what-should-i-deal-with-empty',
    title: 'What Should I Deal With?',
    description: 'Intelligent resurfacing highlights what genuinely needs your attention right now, keeping external memory quiet.',
    positionPreference: 'top',
  },
];

interface FeatureTourOverlayProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const FeatureTourOverlay: React.FC<FeatureTourOverlayProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const { hasSeenOnboarding, hasSeenFeatureTour, markFeatureTourComplete, loading: authLoading } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Automatically start feature tour once onboarding is completed and tour hasn't been seen yet
  useEffect(() => {
    if (forceOpen) {
      setCurrentStepIndex(0);
      setIsVisible(true);
      return;
    }

    if (authLoading) return;

    if (hasSeenOnboarding === true && hasSeenFeatureTour === false) {
      // Delay slightly so home screen is smoothly rendered
      const timer = setTimeout(() => {
        setCurrentStepIndex(0);
        setIsVisible(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [forceOpen, authLoading, hasSeenOnboarding, hasSeenFeatureTour]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Locate and measure target element
  const updateTargetRect = useCallback(() => {
    if (!isVisible || !currentStep) {
      setTargetRect(null);
      return;
    }

    let elem = document.getElementById(currentStep.targetId);
    if (!elem && currentStep.fallbackTargetId) {
      elem = document.getElementById(currentStep.fallbackTargetId);
    }

    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      // Allow scroll animation to settle then read bounding client rect
      const timeout = setTimeout(() => {
        if (elem) {
          setTargetRect(elem.getBoundingClientRect());
        }
      }, 250);
      return () => clearTimeout(timeout);
    } else {
      setTargetRect(null);
    }
  }, [isVisible, currentStep]);

  useEffect(() => {
    updateTargetRect();

    const handleResizeOrScroll = () => {
      if (!currentStep) return;
      let elem = document.getElementById(currentStep.targetId);
      if (!elem && currentStep.fallbackTargetId) {
        elem = document.getElementById(currentStep.fallbackTargetId);
      }
      if (elem) {
        setTargetRect(elem.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, [updateTargetRect, currentStepIndex]);

  const handleNext = async () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsVisible(false);
    await markFeatureTourComplete();
    if (onClose) onClose();
  };

  const handleSkip = async () => {
    setIsVisible(false);
    await markFeatureTourComplete();
    if (onClose) onClose();
  };

  if (!isVisible || !currentStep) return null;

  // Calculate tooltip placement relative to target rect or viewport fallback
  const isTargetVisible = Boolean(targetRect && targetRect.width > 0 && targetRect.height > 0);

  const padding = 8;
  const spotlightStyle: React.CSSProperties = isTargetVisible && targetRect
    ? {
        top: Math.max(4, targetRect.top - padding),
        left: Math.max(4, targetRect.left - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      }
    : {
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
      };

  // Determine tooltip coordinates
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isBottomPreferred =
    currentStep.positionPreference === 'bottom' ||
    (targetRect ? targetRect.top < viewportHeight / 2 : true);

  return (
    <AnimatePresence>
      <div
        id="feature-tour-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Later Feature Tour"
        className="fixed inset-0 z-50 overflow-hidden pointer-events-auto"
      >
        {/* Semi-transparent scrim backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          onClick={handleNext}
        />

        {/* Glowing Spotlight Framing Box around active target element */}
        {isTargetVisible && (
          <motion.div
            layoutId="feature-tour-spotlight"
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={spotlightStyle}
            className="absolute rounded-2xl border-2 border-[var(--accent-gold)] shadow-[0_0_24px_rgba(232,200,122,0.45),inset_0_0_12px_rgba(232,200,122,0.2)] pointer-events-none z-10"
          >
            {/* Animated accent pulse pill in top corner */}
            <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-gold)] opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[var(--accent-gold)] items-center justify-center text-[10px] text-black font-bold">
                {currentStepIndex + 1}
              </span>
            </span>
          </motion.div>
        )}

        {/* Floating Tooltip Card Container */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end sm:justify-center items-center p-4">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: isBottomPreferred ? 16 : -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
            style={{
              maxHeight: '90vh',
            }}
            className="w-full max-w-sm rounded-2xl glass-elevated border border-[var(--border-strong)] bg-[var(--surface-elevated)]/95 shadow-2xl p-5 pointer-events-auto flex flex-col gap-3.5 z-20"
          >
            {/* Header: Tour Step Badge & Persistent Skip Tour */}
            <div className="flex items-center justify-between pb-1 border-b border-[var(--divider)]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg glass-icon-square flex items-center justify-center text-[var(--accent-gold)]">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="type-caption text-xs font-semibold text-[var(--accent-gold)] tracking-wide uppercase">
                  Tour • Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
              </div>

              <button
                id="feature-tour-skip-btn"
                type="button"
                onClick={handleSkip}
                className="type-caption text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer flex items-center gap-1"
                title="Skip feature tour"
              >
                <span>Skip tour</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body Content */}
            <div className="space-y-1.5">
              <h3 className="type-heading text-base font-bold text-[var(--text-primary)]">
                {currentStep.title}
              </h3>
              <p className="type-body-sm text-xs text-[var(--text-secondary)] leading-relaxed font-body">
                {currentStep.description}
              </p>
            </div>

            {/* Step Indicators Dots */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[var(--accent-gold)]'
                      : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-tertiary)]'
                  }`}
                  aria-label={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--divider)]">
              <button
                id="feature-tour-prev-btn"
                type="button"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium border flex items-center gap-1 cursor-pointer transition-all duration-[var(--duration-fast)] ${
                  currentStepIndex === 0
                    ? 'opacity-0 pointer-events-none border-transparent'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] active:scale-[0.97]'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                id="feature-tour-next-btn"
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.97] press-interactive ml-auto"
              >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish tour' : 'Next'}</span>
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
