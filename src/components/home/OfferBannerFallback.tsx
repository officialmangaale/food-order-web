'use client';

import { Utensils } from 'lucide-react';

export function OfferBannerFallback() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(22,184,166,0.26),transparent_30%),radial-gradient(circle_at_16%_82%,rgba(14,75,71,0.34),transparent_28%),linear-gradient(135deg,#0E5F59_0%,#103F3C_48%,#071F1D_100%)]">
      <div className="absolute right-5 top-5 text-white/10 sm:right-10 sm:top-8">
        <Utensils className="h-24 w-24 sm:h-32 sm:w-32" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_42px)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.10),transparent_24%)]" />
    </div>
  );
}
