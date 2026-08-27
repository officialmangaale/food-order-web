'use client';

import { useState, type ReactNode } from 'react';
import { Store, UtensilsCrossed } from 'lucide-react';

type Ratio = 'square' | 'card' | 'wide' | 'hero';

const ratioClasses: Record<Ratio, string> = {
  square: 'aspect-square',
  /** The standard food/restaurant card ratio. */
  card: 'aspect-[4/3]',
  wide: 'aspect-[16/9]',
  hero: 'aspect-[16/7]',
};

interface ThumbnailProps {
  src?: string | null;
  alt: string;
  ratio?: Ratio;
  /** Fallback glyph when there is no image or it fails to load. */
  fallback?: 'dish' | 'restaurant';
  /** Initials shown instead of a glyph — used for restaurants. */
  initials?: string;
  /**
   * Extra classes for the image box. The box is `w-full` and uses `ratio` for
   * its height, so to render a fixed-size thumbnail put it in a sized wrapper
   * and pass `h-full` here rather than fighting the width utility.
   */
  className?: string;
  imageClassName?: string;
  /** Overlays (badges, ratings) positioned against the image box. */
  children?: ReactNode;
  /** Set on the single above-the-fold image of a route. */
  priority?: boolean;
  /** Zooms the image slightly when the parent `.group` is hovered. */
  zoomOnHover?: boolean;
}

/**
 * The one image box for cards. Centralises the fixed aspect ratio, the warm
 * placeholder, the load-failure fallback and the fade-in, so every card in the
 * app reserves identical space and never shifts when an image resolves.
 */
export function Thumbnail({
  src,
  alt,
  ratio = 'card',
  fallback = 'dish',
  initials,
  className = '',
  imageClassName = '',
  children,
  priority,
  zoomOnHover,
}: ThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = Boolean(src) && !failed;
  const Glyph = fallback === 'restaurant' ? Store : UtensilsCrossed;

  return (
    <div
      className={`relative w-full overflow-hidden bg-surface-muted ${ratioClasses[ratio]} ${className}`}
    >
      {showImage ? (
        /* Menu and restaurant imagery comes from arbitrary partner hosts
           (next.config images.remotePatterns is '**'). Routing all of it through
           the Next image optimizer is a deliberate, separate decision with cost
           and reliability implications, so plain <img> is used for now. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? ''}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`img-fade-in absolute inset-0 h-full w-full object-cover ${loaded ? 'loaded' : ''} ${
            zoomOnHover
              ? 'transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.04]'
              : ''
          } ${imageClassName}`}
        />
      ) : (
        <div className="food-placeholder absolute inset-0 flex items-center justify-center">
          {initials ? (
            <span className="text-2xl font-extrabold text-white/90">{initials}</span>
          ) : (
            <Glyph className="h-9 w-9 text-white/70" aria-hidden="true" />
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/** Derives up to two initials for a restaurant placeholder. */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'M';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}
