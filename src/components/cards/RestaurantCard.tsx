'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MetaRow } from '@/components/ui/FoodMeta';
import { Thumbnail, getInitials } from '@/components/ui/Thumbnail';

export interface RestaurantCardProps {
  href: string;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  deliveryTime?: string | null;
  distance?: string | null;
  offerBadge?: string | null;
  closed?: boolean;
  priority?: boolean;
  className?: string;
}

/**
 * The single vertical restaurant card, matching FoodCard's geometry so mixed
 * grids stay on one baseline.
 */
export function RestaurantCard({
  href,
  name,
  subtitle,
  imageUrl,
  rating,
  ratingCount,
  deliveryTime,
  distance,
  offerBadge,
  closed,
  priority,
  className = '',
}: RestaurantCardProps) {
  return (
    <Link
      href={href}
      className={`group card-hover flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 ${className}`}
    >
      <Thumbnail
        src={imageUrl}
        alt={name}
        ratio="card"
        fallback="restaurant"
        initials={getInitials(name)}
        priority={priority}
        zoomOnHover
      >
        {offerBadge && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Badge variant="offer" size="sm">
              {offerBadge}
            </Badge>
          </span>
        )}
        {closed && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white">
            Currently closed
          </span>
        )}
      </Thumbnail>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-1 text-[15px] font-extrabold leading-snug text-ink sm:text-base">
          {name}
        </h3>
        {subtitle && (
          <p className="mt-1 line-clamp-1 text-xs text-ink-muted sm:text-[13px]">{subtitle}</p>
        )}
        <MetaRow
          rating={rating}
          ratingCount={ratingCount}
          deliveryTime={deliveryTime}
          distance={distance}
          className="mt-auto pt-3"
        />
      </div>
    </Link>
  );
}

export interface RestaurantRowProps {
  href: string;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  deliveryTime?: string | null;
  distance?: string | null;
  className?: string;
}

/**
 * Horizontal restaurant row for search results and other list contexts, using
 * the same tokens as RestaurantCard.
 */
export function RestaurantRow({
  href,
  name,
  subtitle,
  imageUrl,
  rating,
  ratingCount,
  deliveryTime,
  distance,
  className = '',
}: RestaurantRowProps) {
  return (
    <Link
      href={href}
      className={`card-hover flex items-center gap-4 rounded-card border border-line bg-surface p-3 shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 ${className}`}
    >
      <div className="h-20 w-20 shrink-0 sm:h-24 sm:w-24">
        <Thumbnail
          src={imageUrl}
          alt={name}
          ratio="square"
          fallback="restaurant"
          initials={getInitials(name)}
          className="h-full rounded-control"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-extrabold text-ink">{name}</h3>
        {subtitle && <p className="mt-1 truncate text-sm text-ink-muted">{subtitle}</p>}
        <MetaRow
          rating={rating}
          ratingCount={ratingCount}
          deliveryTime={deliveryTime}
          distance={distance}
          className="mt-2"
        />
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
    </Link>
  );
}
