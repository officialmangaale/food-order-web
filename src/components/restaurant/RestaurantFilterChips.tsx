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
    <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      <FilterChip
        active={filters.vegOnly}
        onClick={() => onChange({ ...filters, vegOnly: !filters.vegOnly })}
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-[4px] border border-[#1B9A51] text-[#1B9A51]">
          <Leaf className="h-3 w-3" aria-hidden="true" />
        </span>
        Veg Only
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
      className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-[#B31317]/10 ${
        active
          ? 'border-[#B31317] bg-[#B31317] text-white shadow-sm'
          : 'border-[#E6B8B8] bg-white text-[#2B2020] hover:border-[#B31317] hover:bg-[#FFF7F7]'
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {children}
    </button>
  );
}
