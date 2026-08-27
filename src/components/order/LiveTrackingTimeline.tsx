'use client';

import { Check, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TrackingOrder } from '@/types/order';
import { getOrderProgress } from '@/utils/orderStatus';

interface LiveTrackingTimelineProps {
  order: TrackingOrder;
}

export function LiveTrackingTimeline({ order }: LiveTrackingTimelineProps) {
  const progress = getOrderProgress(order.orderStatus, order.deliveryStatus, order.orderType);
  const placedTime = formatFixedTime(order.createdAt);

  return (
    <Card as="section">
      <h2 className="text-section text-ink">Live tracking</h2>

      <ol className="mt-6">
        {progress.steps.map((step, index) => {
          const isLast = index === progress.steps.length - 1;
          const completed = step.state === 'completed';
          const current = step.state === 'current';
          const cancelled = step.state === 'cancelled';

          return (
            <li key={step.id} className="grid grid-cols-[36px_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    completed
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : current
                        ? 'border-brand-700 bg-surface text-brand-700 ring-4 ring-brand-700/15'
                        : cancelled
                          ? 'border-danger bg-danger-tint text-danger'
                          : 'border-line-strong bg-surface-muted text-ink-subtle'
                  }`}
                  aria-hidden="true"
                >
                  {completed ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : cancelled ? (
                    <XCircle className="h-4 w-4" />
                  ) : current ? (
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-current" />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={`h-12 w-0.5 ${completed ? 'bg-brand-700' : 'bg-line'}`}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className={isLast ? 'pb-0' : 'pb-6'}>
                <p
                  className={`text-sm font-extrabold ${
                    current
                      ? 'text-brand-900'
                      : completed
                        ? 'text-ink'
                        : cancelled
                          ? 'text-danger'
                          : 'text-ink-subtle'
                  }`}
                >
                  {step.title}
                  {current && <span className="sr-only"> (current step)</span>}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {index === 0 && placedTime ? placedTime : step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function formatFixedTime(value: string | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date);
}
