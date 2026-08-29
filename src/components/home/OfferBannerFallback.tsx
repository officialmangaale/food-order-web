'use client';

import { Utensils } from 'lucide-react';

export function OfferBannerFallback() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(120deg,#effbf8_0%,#ddf7f2_62%,#c9eee8_100%)]">
      <div className="absolute right-5 top-5 text-brand-700/10 sm:right-10 sm:top-8">
        <Utensils className="h-24 w-24 sm:h-32 sm:w-32" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.35)_0_1px,transparent_1px_42px)] opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.55),transparent_26%)]" />
    </div>
  );
}
