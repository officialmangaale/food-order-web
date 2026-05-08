'use client';

import { SlidersHorizontal } from 'lucide-react';
import { DELIVERY_TIME_OPTIONS, PRICE_RANGE_OPTIONS } from '@/hooks/useSearchFilters';
import type { SearchFilters } from '@/types/search';

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onClear: () => void;
}

export function SearchFilters({ filters, onChange, onClear }: SearchFiltersProps) {
  const hasFilters = Boolean(
    filters.ratingMin || filters.priceRange || filters.deliveryTimeMax || filters.vegOnly
  );

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-[#4B3A3A]">
        <SlidersHorizontal className="h-4 w-4 text-[#A80F15]" aria-hidden="true" />
        Filters
      </span>

      <FilterChip
        active={filters.ratingMin === 4}
        onClick={() => onChange({ ratingMin: filters.ratingMin === 4 ? undefined : 4 })}
      >
        Rating 4.0+
      </FilterChip>

      {PRICE_RANGE_OPTIONS.map((option) => (
        <FilterChip
          key={option.value}
          active={filters.priceRange === option.value}
          onClick={() =>
            onChange({
              priceRange: filters.priceRange === option.value ? undefined : option.value,
            })
          }
        >
          {option.label}
        </FilterChip>
      ))}

      {DELIVERY_TIME_OPTIONS.map((option) => (
        <FilterChip
          key={option.value}
          active={filters.deliveryTimeMax === option.value}
          onClick={() =>
            onChange({
              deliveryTimeMax: filters.deliveryTimeMax === option.value ? undefined : option.value,
            })
          }
        >
          {option.label}
        </FilterChip>
      ))}

      <button
        type="button"
        onClick={() => onChange({ vegOnly: !filters.vegOnly })}
        className={`flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-bold transition ${
          filters.vegOnly
            ? 'border-green-600 bg-green-50 text-green-700'
            : 'border-[#E9CBCB] bg-white text-[#5F4D4D] hover:border-[#B31317] hover:text-[#A80F15]'
        }`}
        aria-pressed={filters.vegOnly}
      >
        <span
          className={`relative h-5 w-9 rounded-full transition ${
            filters.vegOnly ? 'bg-green-600' : 'bg-[#D8C7C7]'
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
              filters.vegOnly ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </span>
        Veg Only
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="h-10 shrink-0 rounded-full px-3 text-sm font-bold text-[#A80F15] transition hover:bg-[#FFF0F0]"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition ${
        active
          ? 'border-[#A80F15] bg-[#FFF0F0] text-[#A80F15]'
          : 'border-[#E9CBCB] bg-white text-[#5F4D4D] hover:border-[#B31317] hover:text-[#A80F15]'
      }`}
    >
      {children}
    </button>
  );
}
