'use client';

import { Check, Circle, XCircle } from 'lucide-react';
import type { TrackingOrder } from '@/types/order';
import { getOrderProgress } from '@/utils/orderStatus';

interface LiveTrackingTimelineProps {
  order: TrackingOrder;
}

export function LiveTrackingTimeline({ order }: LiveTrackingTimelineProps) {
  const progress = getOrderProgress(
    order.orderStatus,
    order.deliveryStatus,
    order.orderType,
  );
  const placedTime = formatFixedTime(order.createdAt);

  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_14px_38px_rgba(123,35,35,0.06)] sm:p-6">
      <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717] sm:text-3xl">Live Tracking</h2>
      <div className="mt-7 space-y-0">
        {progress.steps.map((step, index) => {
          const isLast = index === progress.steps.length - 1;
          const completed = step.state === 'completed';
          const current = step.state === 'current';
          const cancelled = step.state === 'cancelled';

          return (
            <div key={step.id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    completed
                      ? 'border-[#A80F15] bg-[#A80F15] text-white'
                      : current
                        ? 'border-[#A80F15] bg-white text-[#A80F15] shadow-[0_0_0_6px_rgba(168,15,21,0.08)]'
                        : cancelled
                          ? 'border-[#8D6E6E] bg-[#F4F0F0] text-[#8D6E6E]'
                          : 'border-[#F0CFCF] bg-[#FFE0DC] text-[#D9AAA5]'
                  }`}
                  aria-hidden="true"
                >
                  {completed ? (
                    <Check className="h-4 w-4" />
                  ) : cancelled ? (
                    <XCircle className="h-4 w-4" />
                  ) : current ? (
                    <Circle className="h-4 w-4 fill-current" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={`h-12 w-px ${
                      completed ? 'bg-[#A80F15]' : cancelled ? 'bg-[#C6B1B1]' : 'bg-[#F0DADA]'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className={isLast ? 'pb-0' : 'pb-6'}>
                <p
                  className={`text-base font-extrabold tracking-[0.04em] ${
                    completed || current ? 'text-[#1F1717]' : cancelled ? 'text-[#6B4B4B]' : 'text-[#6F5555]'
                  } ${current ? 'text-[#A80F15]' : ''}`}
                >
                  {step.title}
                </p>
                <p className="mt-1 text-sm font-medium text-[#5F4444]">
                  {index === 0 && placedTime ? placedTime : step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
