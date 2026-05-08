import { useMemo } from 'react';
import type { SearchFilters, SearchPriceRange, SearchTab } from '@/types/search';

export const PRICE_RANGE_OPTIONS: { label: string; value: SearchPriceRange }[] = [
  { label: 'Under Rs.100', value: 'under_100' },
  { label: 'Rs.100-Rs.250', value: '100_250' },
  { label: 'Rs.250-Rs.500', value: '250_500' },
  { label: 'Rs.500+', value: '500_plus' },
];

export const DELIVERY_TIME_OPTIONS = [
  { label: 'Under 30 min', value: 30 },
  { label: 'Under 45 min', value: 45 },
  { label: 'Under 60 min', value: 60 },
];

interface SearchParamReader {
  get: (name: string) => string | null;
}

export function useSearchFilters(searchParams: SearchParamReader) {
  return useMemo(() => parseSearchFilters(searchParams), [searchParams]);
}

export function parseSearchFilters(searchParams: SearchParamReader) {
  const priceRange = searchParams.get('price_range');
  const deliveryTime = Number(searchParams.get('delivery_time_max'));
  const ratingMin = Number(searchParams.get('rating_min'));
  const tab = searchParams.get('tab');

  const filters: SearchFilters = {
    ratingMin: ratingMin === 4 ? 4 : undefined,
    priceRange: isPriceRange(priceRange) ? priceRange : undefined,
    deliveryTimeMax: [30, 45, 60].includes(deliveryTime) ? deliveryTime : undefined,
    vegOnly: searchParams.get('veg_only') === 'true',
  };

  return {
    filters,
    tab: tab === 'restaurants' ? 'restaurants' : ('dishes' as SearchTab),
    activeFilterCount: [
      filters.ratingMin,
      filters.priceRange,
      filters.deliveryTimeMax,
      filters.vegOnly,
    ].filter(Boolean).length,
  };
}

function isPriceRange(value: string | null): value is SearchPriceRange {
  return value === 'under_100' || value === '100_250' || value === '250_500' || value === '500_plus';
}
