'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { VegIndicator } from '@/components/ui/FoodMeta';
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
    <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-ink-muted">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
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

      <Chip active={filters.vegOnly} onClick={() => onChange({ vegOnly: !filters.vegOnly })}>
        <VegIndicator vegetarian size="sm" />
        Veg only
      </Chip>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
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
    <Chip active={active} onClick={onClick}>
      {children}
    </Chip>
  );
}
