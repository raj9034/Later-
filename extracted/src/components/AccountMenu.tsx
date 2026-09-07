import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLater } from '../context/LaterContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, LogIn, LogOut, HelpCircle, Sun, Moon, RotateCcw, Sparkles } from 'lucide-react';

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelp?: () => void;
  onReplayTour?: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  isOpen,
  onClose,
  onOpenHelp,
  onReplayTour,
}) => {
  const { resetData, showToast } = useLater();
  const { user, openAuthModal, signOutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 60, right: 16 });

  const isDark = theme === 'dark';

  // Anchor floating panel dynamically below the person-icon in the top-right
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const btn = document.getElementById('header-options-btn');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setPosition({
          top: Math.round(rect.bottom + 8),
          right: Math.max(16, Math.round(window.innerWidth - rect.right)),
        });
      } else {
        setPosition({ top: 60, right: 16 });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Handle ESC key to dismiss
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

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      onClose();
      showToast('Signed out');
    } else {
      showToast(result.error || 'Sign out failed — please try again');
    }
  };

  // Color tokens per exact specifications
  // Light mode: warmer tinted glass, darker text #2E2320, clear pink glow
  // Dark mode: approved values kept completely untouched
  const textColor = isDark ? '#EDEAF5' : '#2E2320';
  const dividerColor = isDark ? 'rgba(181, 132, 255, 0.15)' : 'rgba(232, 137, 156, 0.2)';
  const hoverBg = isDark ? 'rgba(181, 132, 255, 0.12)' : 'rgba(232, 137, 156, 0.10)';
  const sunIconColor = '#E8899C'; // Accent pink
  const moonIconColor = '#B584FF'; // Accent violet

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent scrim / backdrop (rgba(0,0,0,0.3)) covering full screen between page content and menu */}
          <motion.div
            id="account-menu-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.15 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            onClick={onClose}
            className="fixed inset-0 z-[80]"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            aria-hidden="true"
          />

          {/* Floating panel anchored below the person-icon in the top-right, z-index 90 (above scrim) */}
          <motion.div
            ref={menuRef}
            id="header-options-dropdown"
            role="menu"
            aria-label="Account options"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: 0.15, ease: [0, 0, 0.2, 1] },
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: -6,
              transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
            }}
            className="fixed w-[280px] sm:w-[320px] max-w-[calc(100vw-32px)] z-[90] glass-account-menu select-none"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
              background: isDark ? 'rgba(30, 20, 45, 0.75)' : 'rgba(255, 235, 225, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isDark ? '1px solid rgba(181, 132, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '20px',
              boxShadow: isDark
                ? '0 8px 32px rgba(181, 132, 255, 0.25)'
                : '0 8px 32px rgba(232, 137, 156, 0.25)',
              overflow: 'hidden',
            }}
          >
            {user ? (
              <>
                <div
                  className="flex flex-col"
                  style={{
                    padding: '16px 20px',
                    borderBottom: `1px solid ${dividerColor}`,
                  }}
                >
                  <p
                    className="text-[11px] uppercase font-mono tracking-wider"
                    style={{ color: isDark ? 'rgba(237, 234, 245, 0.6)' : 'rgba(46, 35, 32, 0.6)' }}
                  >
                    Account
                  </p>
                  <p
                    className="font-mono truncate mt-0.5"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: textColor,
                    }}
                    title={user.email || ''}
                  >
                    {user.email}
                  </p>
                </div>

                <button
                  id="header-sign-out-btn"
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
                  style={{
                    padding: '16px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: textColor,
                    borderBottom: `1px solid ${dividerColor}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut className="w-5 h-5 shrink-0" style={{ color: textColor }} />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="header-menu-create-account-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('create');
                  }}
                  className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
                  style={{
                    padding: '16px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: textColor,
                    borderBottom: `1px solid ${dividerColor}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <UserPlus className="w-5 h-5 shrink-0" style={{ color: textColor }} />
                  <span>Create account</span>
                </button>
                <button
                  id="header-menu-sign-in-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('signin');
                  }}
                  className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
                  style={{
                    padding: '16px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: textColor,
                    borderBottom: `1px solid ${dividerColor}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogIn className="w-5 h-5 shrink-0" style={{ color: textColor }} />
                  <span>Sign in</span>
                </button>
              </>
            )}

            {/* Theme Toggle option in menu */}
            <button
              id="header-menu-toggle-theme-btn"
              type="button"
              onClick={() => {
                toggleTheme();
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
              style={{
                padding: '16px 20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                color: textColor,
                borderBottom: `1px solid ${dividerColor}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="w-5 h-5 shrink-0" style={{ color: sunIconColor }} />
                  <span>Switch to Dark mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 shrink-0" style={{ color: moonIconColor }} />
                  <span>Switch to Light mode</span>
                </>
              )}
            </button>

            {/* Help / FAQ */}
            {onOpenHelp && (
              <button
                id="header-help-faq-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
                style={{
                  padding: '16px 20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: textColor,
                  borderBottom: `1px solid ${dividerColor}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <HelpCircle className="w-5 h-5 shrink-0" style={{ color: textColor }} />
                <span>How Later Works & FAQ</span>
              </button>
            )}

            {/* Replay feature tour */}
            {onReplayTour && (
              <button
                id="header-replay-tour-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onReplayTour();
                }}
                className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
                style={{
                  padding: '16px 20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: textColor,
                  borderBottom: `1px solid ${dividerColor}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
                onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Sparkles className="w-5 h-5 shrink-0 text-[var(--accent-gold)]" />
                <span>Replay feature tour</span>
              </button>
            )}

            {/* Reset demo memory */}
            <button
              id="header-reset-demo-btn"
              type="button"
              onClick={() => {
                resetData();
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 transition-colors cursor-pointer outline-none"
              style={{
                padding: '16px 20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                color: textColor,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onFocus={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onBlur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <RotateCcw className="w-5 h-5 shrink-0" style={{ color: textColor }} />
              <span>Reset demo memory</span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
