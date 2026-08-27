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
      /* Partner-hosted imagery — see the note in ui/Thumbnail.tsx. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailedImageUrl(imageUrl ?? null)}
      />
    );
  }

  return (
    <div className="food-placeholder absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sheet border border-white/20 bg-white/10 backdrop-blur-sm sm:h-36 sm:w-36">
        {canUseLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-20 w-20 rounded-card object-contain sm:h-24 sm:w-24"
            onError={() => setFailedLogoUrl(logoUrl ?? null)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white">
            <Utensils className="h-7 w-7 opacity-80" aria-hidden="true" />
            <span className="text-2xl font-extrabold">{initials}</span>
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
