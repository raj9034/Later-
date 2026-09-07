import React, { useState } from 'react';
import { useLater } from '../context/LaterContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  UserPlus,
  LogIn,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Heart,
  ShieldCheck,
  Quote,
} from 'lucide-react';

interface ProfileScreenProps {
  onOpenHelp: () => void;
  onReplayTour: () => void;
}

/**
 * Profile / About screen. Consolidates everything that previously lived in
 * the header dropdown (account, theme, help, replay tour, reset demo) plus
 * new trust-building content: founder story, product philosophy, and
 * demo-labeled testimonials, per the redesign brief.
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenHelp,
  onReplayTour,
}) => {
  const { resetData, showToast } = useLater();
  const { user, openAuthModal, signOutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      showToast('Signed out');
    } else {
      showToast(result.error || 'Sign out failed — please try again');
    }
  };

  return (
    <div
      id="profile-screen"
      className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-8 flex flex-col gap-6"
    >
      {/* Header block */}
      <div className="pt-2">
        <h1 className="type-page-title text-[var(--text-primary)]">Profile</h1>
        <p className="type-body-sm text-[var(--text-secondary)] mt-1">
          Your account, preferences, and the story behind Later.
        </p>
      </div>

      {/* Account card */}
      <section
        id="profile-account-card"
        className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden"
      >
        {user ? (
          <div className="p-5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="type-caption uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                Signed in
              </p>
              <p className="type-body font-semibold text-[var(--text-primary)] truncate mt-0.5">
                {user.email}
              </p>
            </div>
            <button
              id="profile-sign-out-btn"
              type="button"
              onClick={handleSignOut}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] type-body-sm font-semibold hover:bg-[var(--surface-sunken)] active:scale-[0.98] press-interactive transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="p-5">
            <p className="type-body font-semibold text-[var(--text-primary)]">
              You're using Later as a guest
            </p>
            <p className="type-body-sm text-[var(--text-secondary)] mt-1 mb-4">
              Create an account to sync your memories across devices.
            </p>
            <div className="flex items-center gap-2">
              <button
                id="profile-create-account-btn"
                type="button"
                onClick={() => openAuthModal('create')}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-white type-body-sm font-semibold active:scale-[0.98] press-interactive transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Create account
              </button>
              <button
                id="profile-sign-in-btn"
                type="button"
                onClick={() => openAuthModal('signin')}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] type-body-sm font-semibold hover:bg-[var(--surface-sunken)] active:scale-[0.98] press-interactive transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Preferences card */}
      <section
        id="profile-preferences-card"
        className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden divide-y divide-[var(--divider)]"
      >
        <button
          id="profile-toggle-theme-btn"
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-[var(--accent-gold)]" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--accent)]" />
            )}
            <span className="type-body text-[var(--text-primary)] font-medium">
              {theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>

        <button
          id="profile-help-btn"
          type="button"
          onClick={onOpenHelp}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[var(--text-primary)]" />
            <span className="type-body text-[var(--text-primary)] font-medium">
              How Later Works &amp; FAQ
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>

        <button
          id="profile-replay-tour-btn"
          type="button"
          onClick={onReplayTour}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" />
            <span className="type-body text-[var(--text-primary)] font-medium">
              Replay feature tour
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>

        <button
          id="profile-reset-demo-btn"
          type="button"
          onClick={resetData}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-[var(--text-primary)]" />
            <span className="type-body text-[var(--text-primary)] font-medium">
              Reset demo memory
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
      </section>

      {/* About / Founder story */}
      <section
        id="profile-about-card"
        className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="type-section-title text-[var(--text-primary)]">About Later</h2>
        </div>

        <p className="type-body text-[var(--text-secondary)] leading-relaxed">
          Later started from a simple frustration: the best ideas, links, and
          things worth remembering almost always show up at the wrong time —
          mid-scroll, mid-conversation, mid-commute. Most apps ask you to file
          them away immediately, under a folder, a tag, a project. Later
          doesn't.
        </p>

        {isAboutExpanded && (
          <div className="mt-3 space-y-3">
            <p className="type-body text-[var(--text-secondary)] leading-relaxed">
              You just save it. Later quietly figures out what it is, when it
              probably matters, and brings it back to you at the right
              moment — not a rigid to-do list, more like a second memory that
              never gets overwhelmed and never forgets.
            </p>
            <p className="type-body text-[var(--text-secondary)] leading-relaxed">
              We built Later to feel calm, not urgent. Intelligent, not
              demanding. It's meant to reduce the mental tax of "I need to
              remember this," not add another inbox to manage.
            </p>
          </div>
        )}

        <button
          id="profile-about-expand-btn"
          type="button"
          onClick={() => setIsAboutExpanded((v) => !v)}
          className="mt-3 type-body-sm font-semibold text-[var(--accent)] cursor-pointer"
        >
          {isAboutExpanded ? 'Show less' : 'Read more'}
        </button>
      </section>

      {/* Trust / testimonials — clearly marked as demo content */}
      <section
        id="profile-testimonials-card"
        className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="type-section-title text-[var(--text-primary)]">
            What people are saying
          </h2>
        </div>
        <p className="type-caption text-[var(--text-tertiary)] mb-4">
          Sample feedback shown for demo purposes — not verified public reviews.
        </p>

        <div className="space-y-3">
          {[
            {
              quote:
                "I stopped losing links in a dozen different apps. Later just remembers for me.",
              name: 'Demo user',
            },
            {
              quote:
                "It doesn't feel like another to-do list. It feels like it's actually paying attention.",
              name: 'Demo user',
            },
          ].map((t, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4"
            >
              <Quote className="w-3.5 h-3.5 text-[var(--text-tertiary)] mb-1.5" />
              <p className="type-body-sm text-[var(--text-secondary)] italic leading-relaxed">
                "{t.quote}"
              </p>
              <p className="type-caption text-[var(--text-tertiary)] mt-2 font-mono">
                — {t.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="type-caption text-[var(--text-tertiary)] text-center pb-2">
        Later · Save it now. Decide later.
      </p>
    </div>
  );
};
