import React from 'react';

export interface LaterLogoProps {
  variant?: 'wordmark' | 'mark' | 'full';
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  className?: string;
  id?: string;
}

/**
 * Reusable Later Brand Component
 * 
 * Rules:
 * - Brand name is strictly "Later" (never use the obsolete "Capture" tagline)
 * - Typographic display in Manrope Bold
 * - Ambient restraint: no heavy drop shadows, no neon gradients
 * - Respects minimum 1x cap-height clear space
 */
export const LaterLogo: React.FC<LaterLogoProps> = ({
  variant = 'wordmark',
  size = 'md',
  subtitle,
  className = '',
  id = 'later-brand-logo',
}) => {
  const sizeConfig = {
    sm: {
      mark: 'w-5 h-5 text-xs',
      text: 'text-base font-bold',
      subtitle: 'text-[10.5px]',
      gap: 'gap-1.5',
    },
    md: {
      mark: 'w-7 h-7 text-sm',
      text: 'text-lg font-bold',
      subtitle: 'text-xs',
      gap: 'gap-2',
    },
    lg: {
      mark: 'w-9 h-9 text-base',
      text: 'text-2xl font-bold',
      subtitle: 'text-sm',
      gap: 'gap-2.5',
    },
  };

  const currentSize = sizeConfig[size];

  // Minimal calm glyph mark for Later: subtle dual overlapping rings symbolizing continuous quiet memory
  const renderMark = () => (
    <div
      className={`${currentSize.mark} rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0 select-none font-display font-semibold`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3/5 h-3/5"
      >
        <circle cx="12" cy="12" r="8" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    </div>
  );

  return (
    <div id={id} className={`inline-flex items-center ${currentSize.gap} select-none ${className}`}>
      {(variant === 'mark' || variant === 'full') && renderMark()}

      {(variant === 'wordmark' || variant === 'full') && (
        <div className="flex flex-col justify-center">
          <span className={`font-display ${currentSize.text} tracking-tight text-[var(--text-primary)] leading-none`}>
            Later
          </span>
          {subtitle && (
            <span className={`font-body ${currentSize.subtitle} text-[var(--text-secondary)] mt-0.5 leading-none`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
