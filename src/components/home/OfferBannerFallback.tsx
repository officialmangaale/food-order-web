'use client';

import { Utensils } from 'lucide-react';

export function OfferBannerFallback() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(255,92,92,0.30),transparent_30%),radial-gradient(circle_at_16%_82%,rgba(215,25,32,0.32),transparent_28%),linear-gradient(135deg,#9B1016_0%,#3A0709_48%,#070202_100%)]">
      <div className="absolute right-5 top-5 text-white/10 sm:right-10 sm:top-8">
        <Utensils className="h-24 w-24 sm:h-32 sm:w-32" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_42px)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.10),transparent_24%)]" />
    </div>
  );
}
