'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'offer';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'border border-transparent bg-brand-700 text-white shadow-brand hover:bg-brand-800 active:bg-brand-900',
  secondary:
    'border border-brand-100 bg-brand-50 text-brand-900 hover:border-brand-200 hover:bg-brand-100 active:bg-brand-200',
  outline:
    'border border-line-strong bg-surface text-ink hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 active:bg-brand-100',
  ghost:
    'border border-transparent bg-transparent text-ink-muted hover:bg-brand-50 hover:text-brand-900 active:bg-brand-100',
  danger:
    'border border-transparent bg-danger text-white shadow-sm hover:bg-red-700 active:bg-red-800',
  offer:
    'border border-transparent bg-cherry-800 text-white shadow-cherry hover:bg-cherry-900 active:bg-cherry-950',
};

/** Heights are fixed per size so buttons never jump when their label changes. */
const sizeClasses: Record<Size, string> = {
  sm: 'h-10 gap-1.5 px-4 text-sm',
  md: 'h-12 gap-2 px-5 text-[15px]',
  lg: 'h-14 gap-2 px-7 text-base',
};

const iconSizeClasses: Record<Size, string> = {
  sm: 'h-10 w-10 px-0',
  md: 'h-12 w-12 px-0',
  lg: 'h-14 w-14 px-0',
};

const spinnerSize: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-[18px] w-[18px]',
  lg: 'h-5 w-5',
};

function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  iconOnly,
  className = '',
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  return [
    'inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full font-bold',
    'transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25',
    'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
    'aria-disabled:pointer-events-none aria-disabled:opacity-45 aria-disabled:shadow-none',
    variantClasses[variant],
    iconOnly ? iconSizeClasses[size] : sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Renders a square button sized for a single icon. Requires aria-label. */
  iconOnly?: boolean;
  children?: React.ReactNode;
  className?: string;
}

interface ButtonProps extends BaseProps {
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Associates the button with a form rendered elsewhere (e.g. a Sheet footer). */
  form?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  title?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    iconOnly,
    className,
    children,
    disabled,
    type = 'button',
    onClick,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, fullWidth, iconOnly, className })}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <Loader2 className={`animate-spin ${spinnerSize[size]}`} aria-hidden="true" />
      )}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends BaseProps {
  href: string;
  /** Renders a non-navigating, visually disabled control while keeping layout stable. */
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  'aria-label'?: string;
  prefetch?: boolean;
}

/**
 * A link styled exactly like Button. Previously every page hand-rolled this,
 * which is where most of the rounded-xl / rounded-full drift came from.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  iconOnly,
  className,
  children,
  disabled,
  ...rest
}: ButtonLinkProps) {
  const classes = buttonClasses({ variant, size, fullWidth, iconOnly, className });

  if (disabled) {
    return (
      <span className={classes} aria-disabled="true" role="link">
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
