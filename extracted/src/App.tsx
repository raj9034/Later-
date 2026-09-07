/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LaterProvider, useLater } from './context/LaterContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { UniversalCapture } from './components/UniversalCapture';
import { HorizontalSwipeNav } from './components/HorizontalSwipeNav';
import { TimelineList } from './components/TimelineList';
import { ScheduleView } from './components/ScheduleView';
import { WhenToBringBackModal } from './components/WhenToBringBackModal';
import { ItemDetailSheet } from './components/ItemDetailSheet';
import { Toast } from './components/Toast';
import { InstantCaptureOrb } from './components/instant-capture/InstantCaptureOrb';
import { UniversalRecallSearch } from './components/UniversalRecallSearch';
import { CreateAccountModal } from './components/auth/CreateAccountModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { HelpFaqModal } from './components/onboarding/HelpFaqModal';
import { FeatureTourOverlay } from './components/onboarding/FeatureTourOverlay';
import { BackgroundGrainOverlay } from './components/BackgroundGrainOverlay';
import { BottomNav, BottomNavTab } from './components/ui/BottomNav';
import { ProfileScreen } from './components/ProfileScreen';

const HomeScreen: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen } = useLater();
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isForceOnboardingOpen, setIsForceOnboardingOpen] = useState<boolean>(false);
  const [isForceTourOpen, setIsForceTourOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const captureSectionRef = useRef<HTMLElement | null>(null);

  // Dynamically sync capture bar height for downstream sticky section headers
  useEffect(() => {
    if (!captureSectionRef.current) return;
    const updateHeight = () => {
      if (captureSectionRef.current) {
        const rect = captureSectionRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          document.documentElement.style.setProperty('--capture-bar-height', `${Math.round(rect.height)}px`);
        }
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(captureSectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Search is presented as a full overlay (existing behavior) rather than an
  // in-place tab body, so tapping the Search tab opens that overlay while
  // keeping the previously active tab underneath it.
  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'search') {
      setIsSearchOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // Manually replaying the tour (e.g. from Profile) must first return to the
  // Home tab, since several tour steps target elements (capture bar, "What
  // Should I Deal With") that only exist while Home is the active screen.
  const handleReplayTour = () => {
    setActiveTab('home');
    setIsSearchOpen(false);
    setIsForceTourOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col font-sans relative selection:bg-[var(--accent-soft)] selection:text-[var(--text-primary)] transition-colors duration-200">
      {/* Light Mode SVG feTurbulence Grain / Noise Texture Overlay */}
      <BackgroundGrainOverlay />

      {/* Toast Feedback */}
      <Toast />

      {/* Floating Instant Capture Orb for Cross-App Clipboard Experience */}
      <InstantCaptureOrb />

      {/* Universal Recall Search Overlay — reachable via the bottom nav's Search tab */}
      <UniversalRecallSearch
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
      />

      {/* Header with Brand & Help Entry (account controls now live in Profile tab) */}
      <Header
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenOnboarding={() => setIsForceOnboardingOpen(true)}
        onReplayTour={handleReplayTour}
      />

      {/* Main Content: switches by active bottom-nav tab. Bottom padding
          reserves room for the fixed bottom nav bar plus safe-area inset. */}
      <main
        className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-5 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      >
        {activeTab === 'home' && (
          <>
            {/* Dominant Universal Capture - Sticky below Header (top-14, z-20) */}
            <section
              ref={captureSectionRef}
              className="sticky top-14 z-20 pt-1 pb-2 bg-[var(--bg)]/90 backdrop-blur-md -mx-1 px-1 transition-colors"
            >
              <UniversalCapture />
            </section>

            <section>
              <HorizontalSwipeNav />
            </section>

            <section className="flex-1">
              <TimelineList />
            </section>
          </>
        )}

        {activeTab === 'schedule' && (
          <section className="flex-1 pt-1">
            <ScheduleView />
          </section>
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            onOpenHelp={() => setIsHelpOpen(true)}
            onReplayTour={handleReplayTour}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav
        activeTab={isSearchOpen ? 'search' : activeTab}
        onChange={handleTabChange}
      />

      {/* Interactive Sheets & Modals */}
      <WhenToBringBackModal />
      <ItemDetailSheet />
      <CreateAccountModal />
      <OnboardingModal
        forceOpen={isForceOnboardingOpen}
        onClose={() => setIsForceOnboardingOpen(false)}
      />
      <HelpFaqModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenTutorial={() => setIsForceOnboardingOpen(true)}
        onReplayTour={handleReplayTour}
      />
      <FeatureTourOverlay
        forceOpen={isForceTourOpen}
        onClose={() => setIsForceTourOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LaterProvider>
          <HomeScreen />
        </LaterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

