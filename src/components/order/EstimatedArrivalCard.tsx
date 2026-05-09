'use client';

import { Phone, Truck } from 'lucide-react';
import type { TrackingOrder } from '@/types/order';
import { getPhoneLink } from '@/utils/maps';
import { getEstimatedArrival } from '@/utils/orderStatus';

interface EstimatedArrivalCardProps {
  order: TrackingOrder;
}

export function EstimatedArrivalCard({ order }: EstimatedArrivalCardProps) {
  const eta = getEstimatedArrival(order);
  const contactPhone = order.rider?.phone ?? order.restaurant.phone;
  const deliveryName = order.rider?.name ?? 'Restaurant Delivery';
  const deliveryMeta = order.rider?.vehicle ?? order.restaurant.name;

  return (
    <section className="grid gap-5 rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_14px_38px_rgba(123,35,35,0.06)] sm:grid-cols-[minmax(180px,0.7fr)_minmax(0,1fr)] sm:items-center sm:p-6">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5A3C3C]">
          Estimated Arrival
        </p>
        <p className="mt-3 text-5xl font-extrabold tracking-normal text-[#A80F15] sm:text-6xl">
          {eta}
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl bg-[#FFF0F0] p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1F1717] text-lg font-extrabold text-white">
          {getInitials(deliveryName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-bold text-[#A80F15]">
            <Truck className="h-4 w-4" aria-hidden="true" />
            <span>Delivery</span>
          </div>
          <p className="mt-1 truncate text-lg font-extrabold text-[#1F1717]">{deliveryName}</p>
          {deliveryMeta && <p className="truncate text-sm font-medium text-[#6B4B4B]">{deliveryMeta}</p>}
        </div>
        {contactPhone && (
          <a
            href={getPhoneLink(contactPhone)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E8B9B9] bg-white text-[#A80F15] transition hover:bg-[#A80F15] hover:text-white"
            aria-label={`Call ${deliveryName}`}
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MD';
}
