'use client';

import { type ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** `filter` chips are toggles; `choice` chips behave as radio options. */
  role?: 'filter' | 'choice';
  className?: string;
  'aria-label'?: string;
}

/**
 * The one filter/choice chip. Replaces the separate teal chip in
 * RestaurantFilterChips and the crimson chip in SearchFilters.
 * Fixed 40px height keeps chip rows from reflowing when labels change.
 */
export function Chip({
  children,
  active = false,
  disabled,
  onClick,
  role = 'filter',
  className = '',
  ...rest
}: ChipProps) {
  const selectionProps =
    role === 'filter' ? { 'aria-pressed': active } : { 'aria-checked': active, role: 'radio' as const };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      {...selectionProps}
      {...rest}
      className={[
        'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4',
        'text-sm font-bold transition-[color,background-color,border-color] duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25',
        'disabled:cursor-not-allowed disabled:opacity-45',
        active
          ? 'border-brand-700 bg-brand-50 text-brand-900'
          : 'border-line-strong bg-surface text-ink-muted hover:border-brand-300 hover:text-brand-800',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

interface ChipRowProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

/**
 * Horizontal chip scroller. Bleeds to the page gutter on mobile so chips can
 * scroll edge-to-edge without the row looking clipped.
 */
export function ChipRow({ children, label, className = '' }: ChipRowProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`hide-scrollbar snap-row gutter-bleed -my-1 flex items-center gap-2 overflow-x-auto py-1 sm:mx-0 sm:px-0 ${className}`}
    >
      {children}
    </div>
  );
}
