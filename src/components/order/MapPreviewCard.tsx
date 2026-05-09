'use client';

import { Map, MapPin } from 'lucide-react';
import type { TrackingOrder } from '@/types/order';
import { getGoogleMapsUrl } from '@/utils/maps';

interface MapPreviewCardProps {
  order: TrackingOrder;
}

export function MapPreviewCard({ order }: MapPreviewCardProps) {
  const lat = order.deliveryAddress?.latitude;
  const lng = order.deliveryAddress?.longitude;
  const mapUrl = typeof lat === 'number' && typeof lng === 'number' ? getGoogleMapsUrl(lat, lng) : '';

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8B9B9] bg-[#7DA5A3] shadow-[0_18px_46px_rgba(123,35,35,0.08)]">
      <div className="relative min-h-[300px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(78,132,132,0.95), rgba(120,164,154,0.8)), linear-gradient(90deg, rgba(255,255,255,0.72) 0 14%, transparent 14% 22%, rgba(255,255,255,0.82) 22% 37%, transparent 37% 45%, rgba(255,255,255,0.74) 45% 60%, transparent 60% 68%, rgba(255,255,255,0.78) 68% 83%, transparent 83%)',
          }}
        />
        <span className="absolute left-[12%] top-[18%] h-20 w-48 -rotate-[28deg] rounded-xl bg-[#F6EDE2] shadow-sm" />
        <span className="absolute left-[30%] top-[7%] h-24 w-64 -rotate-[28deg] rounded-xl bg-[#FFF7EA] shadow-sm" />
        <span className="absolute left-[55%] top-[20%] h-28 w-52 -rotate-[28deg] rounded-xl bg-[#E7DDD0] shadow-sm" />
        <span className="absolute left-[16%] top-[55%] h-20 w-60 -rotate-[28deg] rounded-xl bg-[#F3E8D9] shadow-sm" />
        <span className="absolute left-[50%] top-[60%] h-24 w-72 -rotate-[28deg] rounded-xl bg-[#FFF0E5] shadow-sm" />
        <span className="absolute left-[8%] top-[47%] h-2 w-[92%] -rotate-[28deg] rounded-full bg-[#E1292F]" />
        <span className="absolute left-[36%] top-[0%] h-[112%] w-2 rotate-[21deg] rounded-full bg-[#E1292F]" />
        <span className="absolute left-[47%] top-[26%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15] shadow-lg">
          <MapPin className="h-8 w-8 fill-[#A80F15]/15" aria-hidden="true" />
        </span>
        <span className="absolute left-[61%] top-[42%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15] shadow-lg">
          <MapPin className="h-7 w-7 fill-[#A80F15]/15" aria-hidden="true" />
        </span>

        <div className="absolute inset-x-5 bottom-5">
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#DFAEAE] bg-white/95 px-4 text-lg font-bold text-[#2C1717] shadow-sm backdrop-blur transition hover:bg-[#FFF0F0]"
            >
              <Map className="h-5 w-5" aria-hidden="true" />
              Track on Full Map
            </a>
          ) : (
            <div className="flex min-h-14 items-center justify-center rounded-xl border border-[#DFAEAE] bg-white/90 px-4 text-base font-bold text-[#8D6E6E] backdrop-blur">
              Map location not available
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
