'use client';

import { LogIn } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

interface OrderTrackingErrorProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  showHomeLink?: boolean;
  login?: boolean;
}

export function OrderTrackingError({
  title,
  message,
  actionLabel = 'Retry',
  onAction,
  showHomeLink,
  login,
}: OrderTrackingErrorProps) {
  const homeLink = showHomeLink ? (
    <ButtonLink href="/" variant="outline" size="sm">
      Back to home
    </ButtonLink>
  ) : null;

  return (
    <main id="main-content" className="page-main content-container">
      {login ? (
        <EmptyState icon="order" title={title} description={message}>
          {onAction && (
            <ButtonLink href="/" variant="primary" size="sm">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {actionLabel}
            </ButtonLink>
          )}
          {homeLink}
        </EmptyState>
      ) : (
        <ErrorState title={title} message={message} onRetry={onAction} retryLabel={actionLabel}>
          {homeLink}
        </ErrorState>
      )}
    </main>
  );
}
