'use client';

import { AlertCircle } from 'lucide-react';

interface RestaurantUnavailableBannerProps {
  messages: string[];
}

export function RestaurantUnavailableBanner({ messages }: RestaurantUnavailableBannerProps) {
  if (messages.length === 0) return null;

  return (
    <div className="border-b border-amber-200 bg-warning-tint">
      <div className="page-container flex items-start gap-3 py-4 text-warning">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-bold">{messages[0]}</p>
          {messages.slice(1).map((message) => (
            <p key={message} className="mt-0.5 text-sm text-ink-muted">
              {message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
