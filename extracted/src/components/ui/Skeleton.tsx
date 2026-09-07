import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

/**
 * Reusable Skeleton loader matching Later's "Soft Cloud × Dark Luxury" surfaces.
 * Uses the subtle `later-skeleton` pulse animation with reduced-motion support.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl border border-[var(--border)] p-4',
  };

  const inlineStyles: React.CSSProperties = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`later-skeleton ${variantStyles[variant]} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
};

/**
 * Composite MemoryCard Skeleton loader for page/view transitions.
 */
export const MemoryCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 rounded-2xl bg-[var(--surface-resting)] border border-[var(--border)] space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" className="w-3/4 h-4" />
          <Skeleton variant="text" className="w-1/3 h-3" />
        </div>
      </div>
      <Skeleton variant="text" className="w-full h-3" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton variant="rectangular" className="w-20 h-5 rounded-md" />
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>
    </div>
  );
};
