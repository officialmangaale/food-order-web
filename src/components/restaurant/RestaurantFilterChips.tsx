'use client';

import { Star } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { VegIndicator } from '@/components/ui/FoodMeta';
import type { RestaurantMenuFilters } from '@/components/restaurant/restaurantMenuTypes';

interface RestaurantFilterChipsProps {
  filters: RestaurantMenuFilters;
  onChange: (filters: RestaurantMenuFilters) => void;
  hasBestsellerData: boolean;
  hasRatingData: boolean;
}

export function RestaurantFilterChips({
  filters,
  onChange,
  hasBestsellerData,
  hasRatingData,
}: RestaurantFilterChipsProps) {
  return (
    <div className="flex shrink-0 gap-2">
      <Chip
        active={filters.vegOnly}
        onClick={() => onChange({ ...filters, vegOnly: !filters.vegOnly })}
        aria-label="Vegetarian only"
      >
        <VegIndicator vegetarian size="sm" />
        <span className="sr-only sm:not-sr-only">Veg only</span>
      </Chip>

      <Chip
        active={filters.bestsellers}
        disabled={!hasBestsellerData}
        onClick={() => onChange({ ...filters, bestsellers: !filters.bestsellers })}
      >
        Bestsellers
      </Chip>

      <Chip
        active={filters.ratingFourPlus}
        disabled={!hasRatingData}
        onClick={() => onChange({ ...filters, ratingFourPlus: !filters.ratingFourPlus })}
      >
        Rating 4.0+
        <Star className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </Chip>
    </div>
  );
}
