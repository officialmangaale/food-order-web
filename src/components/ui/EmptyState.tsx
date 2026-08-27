'use client';

import {
  MapPin,
  Package,
  Receipt,
  SearchX,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Button } from './Button';

const icons = {
  search: SearchX,
  cart: ShoppingBag,
  offline: WifiOff,
  location: MapPin,
  restaurant: Store,
  dish: UtensilsCrossed,
  order: Package,
  receipt: Receipt,
} satisfies Record<string, LucideIcon>;

export type EmptyStateIcon = keyof typeof icons;

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary action rendered beside the primary one. */
  children?: ReactNode;
  /** `card` wraps in a bordered surface; `plain` sits directly on the page. */
  variant?: 'card' | 'plain';
  className?: string;
}

/**
 * The single empty state. Every listing, search, cart and profile screen uses
 * this rather than hand-rolling a bordered box.
 */
export function EmptyState({
  icon = 'search',
  title,
  description,
  actionLabel,
  onAction,
  children,
  variant = 'card',
  className = '',
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div
      className={[
        'flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16',
        variant === 'card' ? 'rounded-card border border-line bg-surface shadow-card' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-800">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-extrabold text-ink sm:text-lg">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">{description}</p>
      )}
      {(actionLabel || children) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
