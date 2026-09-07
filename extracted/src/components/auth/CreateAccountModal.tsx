import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useLater } from '../../context/LaterContext';
import { useScrollIntoViewOnFocus } from '../../utils/useScrollIntoViewOnFocus';
import { X, Mail, Lock, CircleAlert as AlertCircle, Loader as Loader2, CircleCheck as CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const CreateAccountModal: React.FC = () => {
  const {
    isCreateAccountOpen,
    setIsCreateAccountOpen,
    authModalMode,
    setAuthModalMode,
    createAccount,
    signIn,
  } = useAuth();
  const { showToast } = useLater();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleFocusScroll = useScrollIntoViewOnFocus();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setError('Please enter a password.');
      return false;
    }

    if (authModalMode === 'create') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (authModalMode === 'create') {
      const result = await createAccount(email, password);
      setIsSubmitting(false);

      if (result.success && result.user) {
        showToast(`Welcome! Account created for ${result.user.email}`);
        setIsCreateAccountOpen(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } else {
      const result = await signIn(email, password);
      setIsSubmitting(false);

      if (result.success && result.user) {
        showToast(`Welcome back, ${result.user.email}!`);
        setIsCreateAccountOpen(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Failed to sign in. Please check your credentials.');
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsCreateAccountOpen(false);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isCreateAccountOpen && (
        <div
          id="create-account-overlay"
          className="auth-atmosphere"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
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

          <motion.div
            id="create-account-modal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
            className="w-full max-w-md glass-auth-card elevation-4 overflow-hidden flex flex-col relative z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--divider)]">
              <div>
                <h2 className="type-heading-lg text-lg font-bold tracking-tight text-[var(--text-primary)] font-display">
                  {authModalMode === 'create' ? 'Create your account' : 'Sign in to Later'}
                </h2>
                <p className="type-body-sm text-[var(--text-secondary)] font-body mt-1">
                  {authModalMode === 'create'
                    ? 'Securely preserve your memories and recall streams'
                    : 'Access your cloud-synced memories across all devices'}
                </p>
              </div>
              <button
                id="close-create-account-btn"
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.97] press-interactive border border-transparent hover:border-[var(--border)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-6 pt-4 pb-0">
              <div
                id="auth-mode-tabs"
                className="grid grid-cols-2 p-1 rounded-2xl glass-resting border border-[var(--border)]"
                role="tablist"
              >
                <button
                  id="tab-mode-create"
                  type="button"
                  role="tab"
                  aria-selected={authModalMode === 'create'}
                  onClick={() => {
                    setAuthModalMode('create');
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all duration-[var(--duration-fast)] cursor-pointer text-center ${
                    authModalMode === 'create'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Create account
                </button>
                <button
                  id="tab-mode-signin"
                  type="button"
                  role="tab"
                  aria-selected={authModalMode === 'signin'}
                  onClick={() => {
                    setAuthModalMode('signin');
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all duration-[var(--duration-fast)] cursor-pointer text-center ${
                    authModalMode === 'signin'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Sign in
                </button>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Banner */}
              {error && (
                <div
                  id="create-account-error"
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl glass-resting border border-[var(--destructive)]/40 text-[var(--destructive)] type-body-sm leading-relaxed animate-in fade-in duration-150 font-body"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--destructive)]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="create-account-email"
                  className="type-label font-body font-medium text-[var(--text-secondary)] block"
                >
                  Email address
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="create-account-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={handleFocusScroll}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 input-glass-resting text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-body"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="create-account-password"
                  className="type-label font-body font-medium text-[var(--text-secondary)] block"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="create-account-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={authModalMode === 'create' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={handleFocusScroll}
                    placeholder={authModalMode === 'create' ? 'At least 6 characters' : 'Enter your password'}
                    className="w-full pl-10 pr-10 py-2.5 input-glass-resting text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-body"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 p-1.5 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.92]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 transition-transform duration-[var(--duration-fast)]" />
                    ) : (
                      <Eye className="w-4 h-4 transition-transform duration-[var(--duration-fast)]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Only in Create Account mode) */}
              {authModalMode === 'create' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="create-account-confirm-password"
                    className="type-label font-body font-medium text-[var(--text-secondary)] block"
                  >
                    Confirm password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="create-account-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      onFocus={handleFocusScroll}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-10 py-2.5 input-glass-resting text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-body"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 p-1.5 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer active:scale-[0.92]"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 transition-transform duration-[var(--duration-fast)]" />
                      ) : (
                        <Eye className="w-4 h-4 transition-transform duration-[var(--duration-fast)]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Security note */}
              <div className="pt-1 flex items-center gap-2 type-body-sm text-[var(--text-secondary)] font-body">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                <span>Protected by Firebase Authentication & Firestore Cloud</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode(authModalMode === 'create' ? 'signin' : 'create');
                    setError(null);
                  }}
                  className="text-xs text-[var(--accent)] hover:underline cursor-pointer font-medium"
                >
                  {authModalMode === 'create'
                    ? 'Already have an account? Sign in'
                    : 'Need an account? Create one'}
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    id="cancel-create-account-btn"
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-2xl border border-[var(--border)] bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer disabled:opacity-50 active:scale-[0.97] press-interactive type-body-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-create-account-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-white type-button font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs active:scale-[0.97] press-interactive"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{authModalMode === 'create' ? 'Creating account...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <span>{authModalMode === 'create' ? 'Create account' : 'Sign in'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
