'use client';

import { Leaf, Star } from 'lucide-react';
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
    <div className="flex shrink-0 gap-2 [&>button:first-child]:w-[58px] [&>button:first-child]:px-3 sm:flex-wrap sm:[&>button:first-child]:w-auto sm:[&>button:first-child]:px-4">
      <FilterChip
        active={filters.vegOnly}
        onClick={() => onChange({ ...filters, vegOnly: !filters.vegOnly })}
      >
        <span className="flex h-5 w-5 items-center justify-center text-[#14B8A6]">
          <Leaf className="h-4 w-4 fill-current" aria-hidden="true" />
        </span>
        <span className="sr-only sm:not-sr-only">Veg Only</span>
      </FilterChip>
      <FilterChip
        active={filters.bestsellers}
        disabled={!hasBestsellerData}
        onClick={() => onChange({ ...filters, bestsellers: !filters.bestsellers })}
      >
        Bestsellers
      </FilterChip>
      <FilterChip
        active={filters.ratingFourPlus}
        disabled={!hasRatingData}
        onClick={() => onChange({ ...filters, ratingFourPlus: !filters.ratingFourPlus })}
      >
        Rating 4.0+
        <Star className="h-3.5 w-3.5" aria-hidden="true" />
      </FilterChip>
    </div>
  );
}

interface FilterChipProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterChip({ active, disabled, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#14B8A6]/15 sm:h-12 ${
        active
          ? 'border-[#14B8A6] bg-[#E8F8F5] text-[#0F766E]'
          : 'border-[#D8DDE3] bg-white text-[#172033] hover:border-[#14B8A6] hover:bg-[#F0FDFA]'
      } px-4 disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {children}
    </button>
  );
}
