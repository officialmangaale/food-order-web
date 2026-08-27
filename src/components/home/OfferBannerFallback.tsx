'use client';

import { Utensils } from 'lucide-react';

export function OfferBannerFallback() {
  return (
    <div className="food-placeholder absolute inset-0">
      <div className="absolute right-5 top-5 text-white/10 sm:right-10 sm:top-8">
        <Utensils className="h-24 w-24 sm:h-32 sm:w-32" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_42px)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.10),transparent_24%)]" />
    </div>
  );
}
