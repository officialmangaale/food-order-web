'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { MetaRow, Price, VegIndicator } from '@/components/ui/FoodMeta';
import { AddToCartControl } from '@/components/ui/QuantityStepper';
import { Thumbnail } from '@/components/ui/Thumbnail';

export interface FoodCardProps {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  displayPrice?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  vegetarian?: boolean | null;
  rating?: number | null;
  ratingCount?: number | null;
  deliveryTime?: string | null;
  distance?: string | null;
  restaurantName?: string | null;
  restaurantHref?: string | null;
  /** Corner badge over the image, e.g. "Trending" or "Bestseller". */
  badge?: string | null;
  badgeTone?: 'inverse' | 'offer' | 'bestseller';
  /** Restaurant is closed — the item can be seen but not ordered. */
  closed?: boolean;
  unavailable?: boolean;
  requiresCustomisation?: boolean;
  quantity?: number;
  onAdd: () => void;
  onIncrease?: () => void;
  onDecrease?: () => void;
  priority?: boolean;
  className?: string;
  /** `compact` is the square-image card used by the browse-menu grid. */
  variant?: 'default' | 'home' | 'compact';
}

/**
 * The single vertical dish card. Backs the homepage rails, the category
 * listing, trending and dish search results, which previously had three
 * different image ratios, two veg indicators and three add buttons.
 *
 * Every text slot has a reserved minimum height so a grid of cards stays on a
 * clean baseline whether or not the API returns a description or a rating.
 */
export function FoodCard({
  name,
  description,
  imageUrl,
  displayPrice,
  price,
  originalPrice,
  vegetarian,
  rating,
  ratingCount,
  deliveryTime,
  distance,
  restaurantName,
  restaurantHref,
  badge,
  badgeTone = 'inverse',
  closed,
  unavailable,
  requiresCustomisation,
  quantity = 0,
  onAdd,
  onIncrease,
  onDecrease,
  priority,
  className = '',
  variant = 'default',
}: FoodCardProps) {
  const blocked = Boolean(unavailable || closed);
  const isHome = variant === 'home';
  /* Square image, tighter type and no rating/time line: the browse-menu grid
     puts cards in a column that is ~105px wide on a small phone. */
  const isCompact = variant === 'compact';

  return (
    <article
      className={`group card-hover flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card ${className}`}
    >
      <Thumbnail
        src={imageUrl}
        alt={name}
        ratio={isCompact ? 'square' : 'card'}
        priority={priority}
        zoomOnHover
      >
        <div
          className={`absolute left-2 top-2 flex items-center gap-1.5 ${
            isCompact ? '' : 'sm:left-3 sm:top-3'
          }`}
        >
          <VegIndicator vegetarian={vegetarian} showLabel={isHome} size={isCompact ? 'sm' : 'md'} />
          {badge && (
            <Badge variant={badgeTone} size="sm">
              {badge}
            </Badge>
          )}
        </div>

        {closed && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white">
            Currently closed
          </span>
        )}
      </Thumbnail>

      <div className={`flex flex-1 flex-col ${isCompact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'}`}>
        <h3
          className={`line-clamp-2 font-extrabold leading-snug text-ink ${
            isCompact ? 'min-h-9 text-[13px] sm:text-[15px]' : 'min-h-10 text-sm sm:text-[15px]'
          }`}
        >
          {name}
        </h3>

        {restaurantName &&
          (restaurantHref ? (
            <Link
              href={restaurantHref}
              className={`mt-1 line-clamp-1 font-semibold text-ink-muted transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/25 ${
                isCompact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[13px]'
              }`}
            >
              {restaurantName}
            </Link>
          ) : (
            <p
              className={`mt-1 line-clamp-1 font-semibold text-ink-muted ${
                isCompact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[13px]'
              }`}
            >
              {restaurantName}
            </p>
          ))}

        {description && (
          <p
            className={`mt-1.5 line-clamp-2 text-ink-subtle ${
              isCompact ? 'text-[11px] leading-4 sm:text-xs' : 'text-xs leading-5'
            }`}
          >
            {description}
          </p>
        )}

        {/* Compact cards keep only the distance: a rating + time + distance row
            wraps to three lines in a 105px column. */}
        <MetaRow
          rating={isCompact ? null : rating}
          ratingCount={isCompact ? null : ratingCount}
          deliveryTime={isCompact ? null : deliveryTime}
          distance={distance}
          className="mt-2"
        />

        {/* Price stacks above a full-width control on phones — a 2-column grid
            at 320-375px cannot fit both on one line. Side by side from `sm`. */}
        <div
          className={`mt-auto gap-2 ${isCompact ? 'pt-2.5' : 'pt-3'} ${
            isHome
              ? 'flex items-center justify-between'
              : 'flex flex-col sm:flex-row sm:items-end sm:justify-between'
          }`}
        >
          <Price display={displayPrice} amount={price} strikeThrough={originalPrice} size="md" />
          <AddToCartControl
            quantity={quantity}
            onAdd={onAdd}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            itemName={name}
            unavailable={blocked}
            unavailableLabel={closed ? 'Closed' : 'Sold out'}
            requiresCustomisation={requiresCustomisation}
            size="sm"
            width={isHome ? 'fixed' : 'responsive'}
          />
        </div>
      </div>
    </article>
  );
}
