'use client';

import { AlertTriangle } from 'lucide-react';
import { type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Secondary action rendered beside Try again. */
  children?: ReactNode;
  variant?: 'card' | 'plain';
  className?: string;
}

/**
 * The single error state. Uses the cherry (alert) tone rather than the brand
 * accent so failures never read as a call to action.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  children,
  variant = 'card',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[
        'flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16',
        variant === 'card' ? 'rounded-card border border-line bg-surface shadow-card' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-extrabold text-ink sm:text-lg">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">{message}</p>}
      {(onRetry || children) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
