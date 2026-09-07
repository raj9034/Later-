import React from 'react';
import { Clock, Calendar, CircleAlert as AlertCircle } from 'lucide-react';

export interface DateTimeBadgeProps {
  dateString?: string;
  isOverdue?: boolean;
  isToday?: boolean;
  isTomorrow?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const DateTimeBadge: React.FC<DateTimeBadgeProps> = ({
  dateString,
  isOverdue = false,
  isToday = false,
  isTomorrow = false,
  className = '',
  onClick,
}) => {
  if (!dateString) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer ${className}`}
      >
        <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
        <span>Someday</span>
      </span>
    );
  }

  let colorClasses = 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]';
  let icon = <Clock className="w-3 h-3 text-[var(--text-secondary)]" />;

  if (isOverdue) {
    colorClasses = 'bg-red-500/10 border-red-500/30 text-[var(--destructive)]';
    icon = <AlertCircle className="w-3 h-3 text-[var(--destructive)]" />;
  } else if (isToday) {
    colorClasses = 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]';
    icon = <Clock className="w-3 h-3 text-[var(--accent)]" />;
  } else if (isTomorrow) {
    colorClasses = 'bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-primary)]';
    icon = <Calendar className="w-3 h-3 text-[var(--text-secondary)]" />;
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono tracking-tight transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-[var(--border)]' : ''
      } ${colorClasses} ${className}`}
    >
      {icon}
      <span className="truncate max-w-[150px]">{dateString}</span>
    </span>
  );
};
