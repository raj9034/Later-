import React from 'react';
import { Loader2, Check } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'subtle'
  | 'ghost'
  | 'pill'
  | 'icon'
  | 'amber'
  | 'danger'
  | 'destructive'
  | 'text'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'pill';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /**
   * Accessible label required when button is icon-only
   */
  'aria-label'?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      isSuccess = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: luxury through restraint, clear focus-ring-later, smooth micro-interactions, active press scale(0.97)
    const baseStyles =
      'inline-flex items-center justify-center font-body select-none transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

    // Variant styles matching Soft Cloud × Dark Luxury
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--accent)] hover:opacity-90 text-white dark:text-[#12111A] font-semibold shadow-xs border border-transparent hover:shadow-sm',
      secondary:
        'bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] font-semibold',
      tertiary:
        'bg-transparent hover:bg-[var(--surface-resting)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent font-medium',
      subtle:
        'bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium',
      ghost:
        'bg-transparent hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent font-medium',
      pill:
        'rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] font-medium px-4 py-1.5 shadow-xs',
      icon:
        'bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] p-2 rounded-xl',
      amber:
        'bg-[var(--accent-gold)] hover:opacity-90 text-white dark:text-[#12111A] font-semibold shadow-xs border border-transparent',
      danger:
        'bg-red-500/10 hover:bg-red-500/20 text-[var(--destructive)] border border-red-500/30 font-medium',
      destructive:
        'bg-red-500/10 hover:bg-red-500/20 text-[var(--destructive)] border border-red-500/30 font-medium',
      text:
        'bg-transparent hover:text-[var(--accent)] text-[var(--text-secondary)] border-none p-0 h-auto font-medium hover:underline shadow-none',
      success:
        'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/40 font-semibold',
    };

    // Size styles with strict 2:1 horizontal to vertical padding ratio and type-button scale
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-8 px-3.5 type-body-sm font-semibold rounded-xl gap-1.5',
      md: 'h-10 px-5 type-button rounded-2xl gap-2 min-h-[40px]',
      lg: 'h-12 px-6 type-button rounded-2xl gap-2.5 min-h-[44px]',
      icon: 'h-10 w-10 min-w-[40px] p-0 rounded-xl flex items-center justify-center',
      pill: 'h-8 px-4 type-label font-semibold rounded-full gap-1.5',
    };

    const isIconOnly = !children && (leftIcon || rightIcon);

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${
          isIconOnly && size !== 'icon' ? sizeStyles.icon : sizeStyles[size]
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : isSuccess ? (
          <Check className="w-4 h-4 text-inherit stroke-[2.5] shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}

        {children && <span className="whitespace-nowrap">{children}</span>}

        {!isLoading && !isSuccess && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Reusable accessible Icon Button ensuring min touch-target and aria-label compliance
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className = '', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        variant={props.variant || 'icon'}
        className={`min-w-[40px] min-h-[40px] ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
