'use client';

import { type ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'brand'
  | 'offer'
  | 'success'
  | 'warning'
  | 'error'
  | 'bestseller'
  | 'inverse';

type BadgeSize = 'sm' | 'md';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted text-ink-muted',
  brand: 'bg-brand-50 text-brand-900',
  offer: 'bg-cherry-50 text-cherry-800',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  error: 'bg-danger-tint text-red-700',
  bestseller: 'bg-bestseller text-bestseller-ink',
  /** For placing on top of photography. */
  inverse: 'bg-brand-900 text-white shadow-card',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-ink-subtle',
  brand: 'bg-brand-600',
  offer: 'bg-cherry-600',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-danger',
  bestseller: 'bg-bestseller-ink',
  inverse: 'bg-white',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
  icon?: ReactNode;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot,
  icon,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-bold leading-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColors[variant]}`} />}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
