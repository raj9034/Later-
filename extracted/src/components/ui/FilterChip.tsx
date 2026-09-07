import React from 'react';

export interface FilterChipProps {
  id?: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  activeClassName?: string;
  activeBadgeClassName?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  id,
  label,
  count,
  icon,
  isActive,
  onClick,
  className = '',
  activeClassName,
  activeBadgeClassName,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full type-label select-none transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer flex items-center gap-1.5 outline-none focus-visible:ring-1 focus-visible:ring-[var(--border)] active:scale-[0.97] press-interactive ${
        isActive
          ? (activeClassName || 'theme-tab-active font-semibold')
          : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-transparent'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`type-caption px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
            isActive
              ? (activeBadgeClassName || 'theme-tab-badge-active')
              : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
