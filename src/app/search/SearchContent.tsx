'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { DishResultCard } from '@/components/search/DishResultCard';
import { RestaurantResultCard } from '@/components/search/RestaurantResultCard';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchPageShell } from '@/components/search/SearchPageShell';
import { SearchSidebar } from '@/components/search/SearchSidebar';
import { SearchTabs } from '@/components/search/SearchTabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { useSearchResults } from '@/hooks/useSearchResults';
import { useCartStore } from '@/store/cartStore';
import { getErrorMessage } from '@/services/http';
import type {
  SearchDishResult,
  SearchFilters as SearchFiltersState,
  SearchRestaurantResult,
  SearchTab,
} from '@/types/search';

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const locked = searchParams.get('locked') === 'true';
  const restaurantId = parseRestaurantId(searchParams.get('restaurant_id'));
  const restaurantIdentifier = searchParams.get('restaurant');
  const restaurantName = searchParams.get('restaurant_name');
  const { searches, addSearch } = useRecentSearches();
  const { filters, tab } = useSearchFilters(searchParams);

  const [customizeDish, setCustomizeDish] = useState<SearchDishResult | null>(null);
  const [pendingDish, setPendingDish] = useState<SearchDishResult | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const setRestaurant = useCartStore((s) => s.setRestaurant);
  const isDifferentRestaurant = useCartStore((s) => s.isDifferentRestaurant);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isResolvingRestaurant,
    restaurantName: resolvedRestaurantName,
  } = useSearchResults({
    query,
    tab,
    filters,
    locked,
    restaurantId,
    restaurantIdentifier,
    restaurantName,
  });

  useEffect(() => {
    if (data && query) addSearch(query);
  }, [addSearch, data, query]);

  const dishes = data?.dishes ?? [];
  const restaurants = locked ? [] : data?.restaurants ?? [];
  const loading = Boolean(query && (isLoading || isResolvingRestaurant));
  const heading = getHeading(query, locked, resolvedRestaurantName ?? restaurantName);

  function updateUrl(mutator: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutator(next);
    const nextString = next.toString();
    router.push(`/search${nextString ? `?${nextString}` : ''}`);
  }

  function runSearch(term: string) {
    const cleanTerm = term.trim();
    updateUrl((params) => {
      if (cleanTerm) params.set('q', cleanTerm);
      else params.delete('q');
      params.delete('page');
    });
  }

  function updateTab(nextTab: SearchTab) {
    updateUrl((params) => {
      params.set('tab', nextTab);
      params.delete('page');
    });
  }

  function updateFilters(patch: Partial<SearchFiltersState>) {
    updateUrl((params) => {
      if ('ratingMin' in patch) updateOptionalParam(params, 'rating_min', patch.ratingMin);
      if ('priceRange' in patch) updateOptionalParam(params, 'price_range', patch.priceRange);
      if ('deliveryTimeMax' in patch) {
        updateOptionalParam(params, 'delivery_time_max', patch.deliveryTimeMax);
      }
      if ('vegOnly' in patch) {
        if (patch.vegOnly) params.set('veg_only', 'true');
        else params.delete('veg_only');
      }
      params.delete('page');
    });
  }

  function clearFilters() {
    updateUrl((params) => {
      params.delete('rating_min');
      params.delete('price_range');
      params.delete('delivery_time_max');
      params.delete('veg_only');
      params.delete('page');
    });
  }

  function hasCustomOptions(dish: SearchDishResult) {
    return (dish.variants?.length ?? 0) > 0 || (dish.addons?.length ?? 0) > 0;
  }

  function addDishDirectly(dish: SearchDishResult) {
    setRestaurant(dish.restaurant_id, getDishRestaurantName(dish), dish.restaurant_slug);
    addItem({
      restaurant_id: dish.restaurant_id,
      restaurant_name: getDishRestaurantName(dish),
      restaurant_slug: dish.restaurant_slug,
      item_id: dish.id,
      name: dish.name,
      image_url: dish.image_url,
      quantity: 1,
      base_price: dish.price,
      category_id: dish.category_id,
      category_name: dish.category_name,
      is_taxable: dish.is_taxable,
      addons: [],
    });
  }

  function handleAddDish(dish: SearchDishResult) {
    if (isDifferentRestaurant(dish.restaurant_id)) {
      setPendingDish(dish);
      setConflictOpen(true);
      return;
    }

    if (hasCustomOptions(dish)) {
      setCustomizeDish(dish);
      return;
    }

    addDishDirectly(dish);
  }

  function handleCartCleared() {
    if (!pendingDish) return;
    const dish = pendingDish;
    setPendingDish(null);

    if (hasCustomOptions(dish)) {
      setCustomizeDish(dish);
      return;
    }

    addDishDirectly(dish);
  }

  function getDishRestaurantName(dish: SearchDishResult) {
    return dish.restaurant_name || resolvedRestaurantName || restaurantName || 'Mangaale partner';
  }

  return (
    <SearchPageShell sidebar={<SearchSidebar recentSearches={searches} onSearchSelect={runSearch} />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {locked && (
              <p className="mb-2 inline-flex rounded-full border border-[#E9CBCB] bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A80F15]">
                Restaurant menu search
              </p>
            )}
            <h1 className="text-2xl font-extrabold text-[#1F1A1A] sm:text-3xl">{heading}</h1>
            <p className="mt-2 text-sm text-[#7B6B6B]">
              {query
                ? 'Fine-tune your search with cuisine, price, rating, and delivery filters.'
                : 'Search dishes, cuisines, and restaurants across Mangaale.'}
            </p>
          </div>

          <SearchTabs
            activeTab={tab}
            onChange={updateTab}
            dishCount={data?.total_dishes ?? dishes.length}
            restaurantCount={locked ? 0 : data?.total_restaurants ?? restaurants.length}
          />
        </div>

        <SearchFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />

        {!query ? (
          <SearchEmptyState onSearchSelect={runSearch} />
        ) : isError ? (
          <SearchErrorCard message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : loading ? (
          <SearchLoadingGrid activeTab={tab} />
        ) : tab === 'restaurants' ? (
          <RestaurantResults restaurants={restaurants} query={query} onSearchSelect={runSearch} />
        ) : (
          <DishResults
            dishes={dishes}
            restaurants={restaurants}
            locked={locked}
            query={query}
            onAddDish={handleAddDish}
            onSearchSelect={runSearch}
          />
        )}
      </div>

      <ItemCustomizeModal
        item={customizeDish}
        restaurantId={customizeDish?.restaurant_id ?? 0}
        restaurantName={customizeDish ? getDishRestaurantName(customizeDish) : ''}
        restaurantSlug={customizeDish?.restaurant_slug}
        onClose={() => setCustomizeDish(null)}
      />
      <CartConflictModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        newRestaurantName={pendingDish ? getDishRestaurantName(pendingDish) : ''}
        onCleared={handleCartCleared}
      />
    </SearchPageShell>
  );
}

function DishResults({
  dishes,
  restaurants,
  locked,
  query,
  onAddDish,
  onSearchSelect,
}: {
  dishes: SearchDishResult[];
  restaurants: SearchRestaurantResult[];
  locked: boolean;
  query: string;
  onAddDish: (dish: SearchDishResult) => void;
  onSearchSelect: (term: string) => void;
}) {
  if (dishes.length === 0) {
    return <SearchEmptyState query={query} onSearchSelect={onSearchSelect} />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {dishes.map((dish) => (
          <DishResultCard key={`${dish.restaurant_id}-${dish.id}`} dish={dish} onAdd={onAddDish} />
        ))}
      </div>

      {!locked && restaurants.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#1F1A1A]">Related restaurants</h2>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {restaurants.slice(0, 4).map((restaurant) => (
              <RestaurantResultCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RestaurantResults({
  restaurants,
  query,
  onSearchSelect,
}: {
  restaurants: SearchRestaurantResult[];
  query: string;
  onSearchSelect: (term: string) => void;
}) {
  if (restaurants.length === 0) {
    return <SearchEmptyState query={query} onSearchSelect={onSearchSelect} />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {restaurants.map((restaurant) => (
        <RestaurantResultCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}

function SearchLoadingGrid({ activeTab }: { activeTab: SearchTab }) {
  if (activeTab === 'restaurants') {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="flex gap-4 rounded-2xl border border-[#F0DADA] bg-white p-3">
            <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-3 py-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-[#F0DADA] bg-white">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-[#F0DADA] bg-white px-6 py-12 text-center shadow-[0_14px_34px_rgba(31,41,55,0.05)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F0]">
        <AlertTriangle className="h-7 w-7 text-[#A80F15]" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-[#1F1A1A]">Search is taking a pause</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
      >
        Try again
      </button>
    </div>
  );
}

function getHeading(query: string, locked: boolean, restaurantName?: string | null) {
  if (!query) return locked ? `Search ${restaurantName ?? 'this menu'}` : 'Search Mangaale';
  if (locked) return `Results in ${restaurantName ?? 'this restaurant'} for "${query}"`;
  return `Results for "${query}"`;
}

function updateOptionalParam(params: URLSearchParams, key: string, value: unknown) {
  if (value == null || value === false || value === '') {
    params.delete(key);
    return;
  }
  params.set(key, String(value));
}

function parseRestaurantId(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
