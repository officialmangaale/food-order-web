'use client';

import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'cherry';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted text-ink-muted',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-bestseller text-bestseller-ink',
  error: 'bg-red-50 text-red-700',
  cherry: 'bg-brand-50 text-brand-800',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', className = '', dot }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold
        ${variants[variant]} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-green-500' :
          variant === 'error' ? 'bg-red-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'cherry' ? 'bg-brand-500' :
          'bg-ink-subtle'
        }`} />
      )}
      {children}
    </span>
  );
}
