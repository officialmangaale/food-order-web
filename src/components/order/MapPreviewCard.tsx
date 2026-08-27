'use client';

import { Map, MapPin } from 'lucide-react';
import type { TrackingOrder } from '@/types/order';
import { getGoogleMapsUrl } from '@/utils/maps';

interface MapPreviewCardProps {
  order: TrackingOrder;
}

/**
 * A stylised map stand-in — no live map provider is wired up. Kept deliberately
 * abstract and on-brand so it reads as decoration rather than a real map, with
 * the actual navigation handed off to Google Maps.
 */
export function MapPreviewCard({ order }: MapPreviewCardProps) {
  const lat = order.deliveryAddress?.latitude;
  const lng = order.deliveryAddress?.longitude;
  const mapUrl = typeof lat === 'number' && typeof lng === 'number' ? getGoogleMapsUrl(lat, lng) : '';

  return (
    <section className="overflow-hidden rounded-card border border-line shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-900 sm:aspect-[16/10]">
        {/* Abstract street grid. */}
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(14,75,71,0.96), rgba(16,159,144,0.75))',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.6) 2px, transparent 2px), linear-gradient(rgba(255,255,255,0.6) 2px, transparent 2px)',
            backgroundSize: '56px 56px',
          }}
          aria-hidden="true"
        />
        {/* Route line between the two pins. */}
        <span
          className="absolute left-[14%] top-[52%] h-1.5 w-[72%] -rotate-[24deg] rounded-full bg-white/85"
          aria-hidden="true"
        />

        <span
          className="absolute left-[26%] top-[34%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-brand-800 shadow-elevated"
          aria-hidden="true"
        >
          <MapPin className="h-5 w-5" />
        </span>
        <span
          className="absolute left-[72%] top-[64%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cherry-800 text-white shadow-elevated"
          aria-hidden="true"
        >
          <MapPin className="h-5 w-5" />
        </span>

        <div className="absolute inset-x-4 bottom-4">
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface px-4 text-sm font-extrabold text-ink shadow-card transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              Open in Google Maps
            </a>
          ) : (
            <p className="flex min-h-12 items-center justify-center rounded-full bg-surface/90 px-4 text-sm font-bold text-ink-muted backdrop-blur">
              Map location not available
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
