import React from 'react';

export interface NavItemProps {
  id?: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Reusable navigation tab item following Later's luxury through restraint philosophy.
 * Light mode: crisp contrast with soft blush glow
 * Dark mode: deep purple glow with white bold text
 */
export const NavItem: React.FC<NavItemProps> = ({
  id,
  label,
  count,
  icon,
  isActive,
  onClick,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={ariaLabel || label}
      disabled={disabled}
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full type-label select-none transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-[0.97] press-interactive disabled:opacity-40 disabled:pointer-events-none ${
        isActive
          ? 'theme-tab-active font-semibold shadow-xs'
          : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-resting-hover)] border border-transparent'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`type-caption px-1.5 py-0.5 rounded-full font-bold text-[10px] transition-colors ${
            isActive
              ? 'theme-tab-badge-active'
              : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export interface NavigationProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  role?: string;
  'aria-label'?: string;
}

/**
 * Reusable horizontal scrollable navigation container for category views and filter tabs.
 */
export const Navigation: React.FC<NavigationProps> = ({
  id,
  children,
  className = '',
  role = 'tablist',
  'aria-label': ariaLabel = 'Category navigation',
}) => {
  return (
    <nav
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={`w-full overflow-x-auto no-scrollbar py-2.5 border-b border-[var(--divider)] ${className}`}
    >
      <div className="flex items-center gap-1.5 px-0.5 min-w-max">
        {children}
      </div>
    </nav>
  );
};
