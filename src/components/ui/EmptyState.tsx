'use client';

import { SearchX, WifiOff, ShoppingBag } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: 'search' | 'cart' | 'offline';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons = {
  search: SearchX,
  cart: ShoppingBag,
  offline: WifiOff,
};

export function EmptyState({ icon = 'search', title, description, actionLabel, onAction }: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <Icon className="h-7 w-7 text-brand-800" aria-hidden="true" />
      </div>
      <h3 className="mb-1 text-lg font-extrabold text-ink">{title}</h3>
      {description && <p className="max-w-xs text-sm leading-6 text-ink-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
