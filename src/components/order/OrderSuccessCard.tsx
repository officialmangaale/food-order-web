'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import type { TrackingOrder } from '@/types/order';
import { isNegativeStatus } from '@/types/order';
import { getTrackingCopy } from '@/utils/orderStatus';

interface OrderSuccessCardProps {
  order: TrackingOrder;
}

export function OrderSuccessCard({ order }: OrderSuccessCardProps) {
  const copy = getTrackingCopy(order);
  const negative = isNegativeStatus(order.orderStatus);

  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white px-5 py-8 text-center shadow-[0_18px_46px_rgba(123,35,35,0.07)] sm:px-8 sm:py-10">
      <div
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
          negative ? 'bg-[#F4F0F0] text-[#8D6E6E]' : 'bg-[#FFE0DC] text-[#A80F15]'
        }`}
        aria-hidden="true"
      >
        {negative ? <XCircle className="h-9 w-9" /> : <CheckCircle2 className="h-9 w-9" />}
      </div>
      <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-normal text-[#1F1717] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 text-lg text-[#5A3C3C]">{copy.subtitle}</p>
      <div className="mt-6 inline-flex items-center rounded-xl bg-[#FFF0F0] px-5 py-3 text-sm font-extrabold tracking-[0.12em] text-[#2C1717]">
        Order ID: {order.displayOrderId}
      </div>
      {order.cancellationReason && (
        <p className="mx-auto mt-4 max-w-md rounded-xl bg-[#F8F1F1] px-4 py-3 text-sm font-semibold text-[#6B4B4B]">
          {order.cancellationReason}
        </p>
      )}
    </section>
  );
}
