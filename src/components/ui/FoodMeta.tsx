'use client';

import { Clock, MapPin, Star } from 'lucide-react';
import { formatMoney } from '@/utils/money';

/* ============================================================================
   Small, shared food-domain display primitives.
   Previously each of these existed in 2-3 slightly different forms across
   home cards, menu cards, search results and the cart.
   ============================================================================ */

interface VegIndicatorProps {
  /** `undefined` renders nothing — the API does not always classify an item. */
  vegetarian?: boolean | null;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The standard Indian veg/non-veg mark: a square outline with a filled dot.
 * Green = vegetarian, red = non-vegetarian. Replaces the "Veg"/"Non-veg" text
 * pill and the leaf-icon variant that were previously used side by side.
 */
export function VegIndicator({ vegetarian, size = 'md', className = '' }: VegIndicatorProps) {
  if (vegetarian == null) return null;

  const box = size === 'sm' ? 'h-3.5 w-3.5 rounded-[3px]' : 'h-[18px] w-[18px] rounded';
  const dot = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const tone = vegetarian ? 'border-veg text-veg' : 'border-nonveg text-nonveg';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border-[1.5px] bg-white/95 ${box} ${tone} ${className}`}
      role="img"
      aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={`rounded-full bg-current ${dot}`} />
    </span>
  );
}

interface RatingProps {
  value?: number | null;
  count?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

/** Star + numeric rating. One implementation, one star colour. */
export function Rating({ value, count, size = 'sm', className = '' }: RatingProps) {
  if (value == null) return null;

  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const star = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-ink ${text} ${className}`}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} ratings` : ''}`}
    >
      <Star className={`${star} shrink-0 fill-star text-star`} aria-hidden="true" />
      <span>{value.toFixed(1)}</span>
      {count != null && count > 0 && (
        <span className="font-semibold text-ink-subtle">({count})</span>
      )}
    </span>
  );
}

interface MetaRowProps {
  deliveryTime?: string | null;
  distance?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  className?: string;
}

/**
 * The delivery-info line under a card title: rating, time, distance.
 * Renders nothing when there is no data, so cards don't hold empty space.
 */
export function MetaRow({
  deliveryTime,
  distance,
  rating,
  ratingCount,
  className = '',
}: MetaRowProps) {
  const hasAny = rating != null || deliveryTime || distance;
  if (!hasAny) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-ink-muted ${className}`}
    >
      {rating != null && <Rating value={rating} count={ratingCount} />}
      {deliveryTime && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {deliveryTime}
        </span>
      )}
      {distance && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {distance}
        </span>
      )}
    </div>
  );
}

interface PriceProps {
  /** Pre-formatted display price from the API, preferred when present. */
  display?: string | null;
  amount?: number | null;
  /** Original price, shown struck through when higher than the live price. */
  strikeThrough?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priceSizes = {
  sm: 'text-sm',
  md: 'text-base sm:text-lg',
  lg: 'text-xl sm:text-2xl',
};

/** Price with optional original-price strike-through. */
export function Price({
  display,
  amount,
  strikeThrough,
  size = 'md',
  className = '',
}: PriceProps) {
  const primary = display || (amount != null ? formatMoney(amount) : '');
  if (!primary) return null;

  const showStrike = strikeThrough != null && amount != null && strikeThrough > amount;

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={`font-extrabold text-ink ${priceSizes[size]}`}>{primary}</span>
      {showStrike && (
        <span className="text-xs font-semibold text-ink-subtle line-through">
          {formatMoney(strikeThrough)}
        </span>
      )}
    </span>
  );
}
