'use client';

import { useMemo, useState } from 'react';
import { Utensils } from 'lucide-react';

interface RestaurantHeroImageProps {
  imageUrl?: string;
  logoUrl?: string;
  name: string;
}

export function RestaurantHeroImage({ imageUrl, logoUrl, name }: RestaurantHeroImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const canUseHeroImage = Boolean(imageUrl && failedImageUrl !== imageUrl);
  const canUseLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);
  const initials = useMemo(() => getInitials(name), [name]);

  if (canUseHeroImage) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailedImageUrl(imageUrl ?? null)}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,#210607_0%,#5B060B_45%,#110809_100%)]">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm sm:h-36 sm:w-36">
        {canUseLogo ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-20 w-20 rounded-2xl object-contain sm:h-24 sm:w-24"
            onError={() => setFailedLogoUrl(logoUrl ?? null)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white">
            <Utensils className="h-8 w-8 opacity-80" aria-hidden="true" />
            <span className="text-3xl font-extrabold tracking-normal">{initials}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'M';
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}
