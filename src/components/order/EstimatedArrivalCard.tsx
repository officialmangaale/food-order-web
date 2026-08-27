'use client';

import { Phone, Truck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TrackingOrder } from '@/types/order';
import { getPhoneLink } from '@/utils/maps';
import { getEstimatedArrival } from '@/utils/orderStatus';

interface EstimatedArrivalCardProps {
  order: TrackingOrder;
}

export function EstimatedArrivalCard({ order }: EstimatedArrivalCardProps) {
  const eta = getEstimatedArrival(order);
  const contactPhone = order.rider?.phone ?? order.restaurant.phone;
  const deliveryName = order.rider?.name ?? 'Restaurant delivery';
  const deliveryMeta = order.rider?.vehicle ?? order.restaurant.name;

  return (
    <Card as="section" className="grid gap-5 sm:grid-cols-[minmax(160px,0.6fr)_minmax(0,1fr)] sm:items-center">
      <div>
        <p className="text-eyebrow uppercase text-ink-subtle">Estimated arrival</p>
        <p className="mt-2 text-display text-brand-900">{eta}</p>
      </div>

      <div className="flex items-center gap-3 rounded-card bg-surface-sunken p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-extrabold text-white">
          {getInitials(deliveryName)}
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-800">
            <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Delivery
          </span>
          <p className="mt-0.5 truncate text-sm font-extrabold text-ink">{deliveryName}</p>
          {deliveryMeta && <p className="truncate text-sm text-ink-muted">{deliveryMeta}</p>}
        </div>
        {contactPhone && (
          <a
            href={getPhoneLink(contactPhone)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-700 bg-surface text-brand-800 transition-colors hover:bg-brand-700 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
            aria-label={`Call ${deliveryName}`}
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
        )}
      </div>
    </Card>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'MD'
  );
}
