'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CategoryRail, CategoryRailSkeleton } from '@/components/category/CategoryRail';
import { CategoryItemCard } from '@/components/home/CategoryItemCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { LocationModal } from '@/components/location/LocationModal';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { VegIndicator } from '@/components/ui/FoodMeta';
import { CardGridSkeleton, LoadingAnnouncement } from '@/components/ui/Skeleton';
import { SortMenu, type SortOption } from '@/components/ui/SortMenu';
import { useAppHeaderOffset } from '@/hooks/useAppHeaderOffset';
import { useCategoryItems } from '@/hooks/useCategoryItems';
import { useExploreCategories } from '@/hooks/useExploreCategories';
import { useHomeMenuOffers } from '@/hooks/useHomeMenuOffers';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { categoryItemToMenuItem, menuOffersToCategoryFoodItems } from '@/utils/categoryAdapter';
import type { CategoryFoodItem, HomeCategory } from '@/types/category';

interface CategoryListingClientProps {
  categoryKey: string;
  initialName?: string;
  initialLat?: number;
  initialLng?: number;
  initialRadiusKm?: number;
}

const PAGE_LIMIT = 20;
const DEFAULT_RADIUS_KM = 7;
const OFFERS_KEY = 'offers';
const OFFERS_LIMIT = 30;
const EMPTY_CATEGORIES: HomeCategory[] = [];

/** Grid geometry is shared with the skeleton so loading never shifts the page. */
const GRID_CLASSNAME = 'category-item-grid';

/**
 * Sorting is applied client-side over the dishes already loaded. The backend
 * `sort` parameter is left at its original 'recommended' value because no other
 * value is known to be supported by /customer-web/categories/{key}/items, and
 * guessing one risks breaking the listing. Ordering therefore covers everything
 * fetched so far, and stays correct as more pages are appended.
 */
const SORT_OPTIONS: SortOption[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'distance', label: 'Nearest first' },
];

function sortItems(items: CategoryFoodItem[], sort: string) {
  if (sort === 'recommended') return items;

  const sorted = [...items];
  if (sort === 'price_low') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price_high') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'distance') {
    return sorted.sort(
      (a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
    );
  }
  return sorted;
}

/**
 * Browse menu: the backend category rail on the left, dishes for the selected
 * category on the right.
 *
 * Every category, dish, price, image and veg mark comes from the existing
 * customer-web endpoints. Selecting a category swaps the grid in place — React
 * Query serves already-fetched categories from cache, the URL is rewritten with
 * the History API rather than navigated, and the cart, location and scroll
 * position are untouched.
 */
export function CategoryListingClient({
  categoryKey: categoryKeyProp,
  initialName,
  initialLat,
  initialLng,
  initialRadiusKm,
}: CategoryListingClientProps) {
  const routeCategoryKey = normalizeCategoryKey(categoryKeyProp);

  const storeLat = useLocationStore((state) => state.latitude);
  const storeLng = useLocationStore((state) => state.longitude);
  const lat = initialLat ?? storeLat;
  const lng = initialLng ?? storeLng;
  const radiusKm = initialRadiusKm ?? DEFAULT_RADIUS_KM;
  const headerOffset = useAppHeaderOffset();

  const [requestedKey, setRequestedKey] = useState(routeCategoryKey);
  const [sort, setSort] = useState('recommended');
  const [vegOnly, setVegOnly] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CategoryFoodItem[]>([]);
  const [customizeItem, setCustomizeItem] = useState<CategoryFoodItem | null>(null);
  const [pendingItem, setPendingItem] = useState<CategoryFoodItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const isDifferentRestaurant = useCartStore((state) => state.isDifferentRestaurant);

  /* ——— Categories: the same query the home rail uses, so arriving from home
     renders instantly from cache instead of refetching. ——— */
  const categoriesQuery = useExploreCategories({ lat, lng, radiusKm, includeAll: true });
  const backendCategories = categoriesQuery.data ?? EMPTY_CATEGORIES;

  /* ——— Offers: the existing menu-offers feed (it reads the stored location
     itself). The rail only gains an Offers entry when the backend actually
     returns offers and the category list has no offer category of its own. ——— */
  const offersQuery = useHomeMenuOffers({ radiusKm, limit: OFFERS_LIMIT });
  const offerItems = useMemo(
    () => menuOffersToCategoryFoodItems(offersQuery.data),
    [offersQuery.data]
  );
  /** Backend offer badge text, keyed the same way the cards are. */
  const offerBadges = useMemo(() => {
    const badges = new Map<string, string>();
    for (const offer of offersQuery.data) {
      if (offer.offerItemId == null || !offer.badgeText) continue;
      badges.set(`${offer.restaurantId}-${offer.offerItemId}`, offer.badgeText);
    }
    return badges;
  }, [offersQuery.data]);

  const hasBackendOffersCategory = useMemo(
    () => backendCategories.some(isOfferCategory),
    [backendCategories]
  );
  const offersEntryVisible =
    !hasBackendOffersCategory && (offersQuery.isLoading || offerItems.length > 0);

  const categories = useMemo(() => {
    if (!offersEntryVisible || backendCategories.length === 0) return backendCategories;

    const offersCategory: HomeCategory = {
      key: OFFERS_KEY,
      name: 'Offers',
      icon: null,
      imageUrl: null,
      categoryType: 'offer',
      itemCount: offerItems.length,
      isActive: true,
    };

    // Directly after All, as the second entry in the rail.
    const [first, ...rest] = backendCategories;
    return first.key === 'all' ? [first, offersCategory, ...rest] : [offersCategory, ...backendCategories];
  }, [backendCategories, offerItems.length, offersEntryVisible]);

  const selectedCategory = useMemo(() => {
    if (categories.length === 0) return undefined;
    return (
      categories.find((category) => category.key === requestedKey) ??
      categories.find((category) => category.key === 'all') ??
      categories[0]
    );
  }, [categories, requestedKey]);

  const selectedKey = selectedCategory?.key ?? requestedKey;
  const showingOffers = !hasBackendOffersCategory && selectedKey === OFFERS_KEY;
  const categoryName = selectedCategory?.name ?? normalizeCategoryName(routeCategoryKey, initialName);

  /* ——— Dishes for the selected category. Cached per key, so switching back to
     a category already viewed does not hit the network again. ——— */
  const itemsQuery = useCategoryItems({
    categoryKey: selectedKey,
    lat,
    lng,
    radiusKm,
    page,
    limit: PAGE_LIMIT,
    sort: 'recommended',
    vegOnly,
    enabled: Boolean(selectedKey) && !showingOffers,
  });

  // `sort` is deliberately absent: it is applied client-side and must not
  // discard already-fetched pages.
  const requestKey = `${selectedKey}:${lat ?? ''}:${lng ?? ''}:${radiusKm}:${vegOnly}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setItems([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [requestKey]);

  useEffect(() => {
    if (showingOffers || !itemsQuery.data) return;

    const nextItems = itemsQuery.data.items;
    const timer = window.setTimeout(() => {
      setItems((currentItems) => {
        if (page === 1) return nextItems;
        return mergeUniqueItems(currentItems, nextItems);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [itemsQuery.data, page, showingOffers]);

  /** Keeps the address bar honest without a navigation, so state survives. */
  const syncUrl = useCallback(
    (category: HomeCategory) => {
      const query = new URLSearchParams(window.location.search);
      query.set('name', category.name);
      window.history.replaceState(
        null,
        '',
        `/categories/${encodeURIComponent(category.key)}?${query.toString()}`
      );
    },
    []
  );

  const handleCategorySelect = (category: HomeCategory) => {
    if (category.key === selectedKey) return;

    setRequestedKey(category.key);
    syncUrl(category);
    // `nearest` only scrolls when the grid has actually left the viewport.
    gridRef.current?.scrollIntoView({ block: 'nearest' });
  };

  const addItemDirectly = (item: CategoryFoodItem) => {
    setRestaurant(item.restaurantId, item.restaurantName, item.restaurantSlug);
    addItem({
      restaurant_id: item.restaurantId,
      restaurant_name: item.restaurantName,
      restaurant_slug: item.restaurantSlug,
      item_id: item.itemId,
      name: item.name,
      image_url: item.imageUrl,
      quantity: 1,
      base_price: item.price,
      category_id: item.categoryId,
      category_name: item.categoryName,
      is_taxable: item.isTaxable,
      addons: [],
    });
  };

  const hasCustomOptions = (item: CategoryFoodItem) =>
    Boolean(
      item.hasVariants ||
        item.hasAddons ||
        (item.variants?.length ?? 0) > 0 ||
        (item.addons?.length ?? 0) > 0
    );

  const handleAddItem = (item: CategoryFoodItem) => {
    if (isDifferentRestaurant(item.restaurantId)) {
      setPendingItem(item);
      setConflictOpen(true);
      return;
    }

    if (hasCustomOptions(item)) {
      setCustomizeItem(item);
      return;
    }

    addItemDirectly(item);
  };

  const handleCartCleared = () => {
    if (!pendingItem) return;

    const item = pendingItem;
    setPendingItem(null);

    if (hasCustomOptions(item)) {
      setCustomizeItem(item);
      return;
    }

    addItemDirectly(item);
  };

  const categoryMenuItem = customizeItem ? categoryItemToMenuItem(customizeItem) : null;

  /* The offers feed is a single unpaginated response, so it skips the paging
     state entirely and is filtered in place. */
  const offersVisibleItems = useMemo(
    () => (vegOnly ? offerItems.filter((item) => item.isVegetarian === true) : offerItems),
    [offerItems, vegOnly]
  );
  const sourceItems = showingOffers ? offersVisibleItems : items;
  const visibleItems = useMemo(() => sortItems(sourceItems, sort), [sourceItems, sort]);

  const totalCount = showingOffers
    ? offersVisibleItems.length
    : itemsQuery.data?.totalCount ?? itemsQuery.data?.pagination.totalCount;
  const hasMoreItems =
    !showingOffers &&
    Boolean(itemsQuery.data?.pagination.hasMore || (totalCount != null && items.length < totalCount));

  const categoriesLoading = categoriesQuery.isLoading;
  const itemsLoading = showingOffers
    ? offersQuery.isLoading
    : page === 1 && items.length === 0 && itemsQuery.isLoading;
  const loadingMore = !showingOffers && page > 1 && itemsQuery.isFetching;
  const categoriesError = getErrorMessage(categoriesQuery.error);
  const itemsError = showingOffers
    ? getErrorMessage(offersQuery.error)
    : getErrorMessage(itemsQuery.error);
  const hasFilters = vegOnly || sort !== 'recommended';

  const clearFilters = () => {
    setVegOnly(false);
    setSort('recommended');
  };

  const retryItems = () => {
    if (showingOffers) offersQuery.refetch();
    else itemsQuery.refetch();
  };

  const resultCountLabel = useMemo(() => {
    if (itemsLoading || sourceItems.length === 0) return undefined;
    if (totalCount != null && totalCount > sourceItems.length) {
      return `${sourceItems.length} of ${totalCount} dishes`;
    }
    return `${sourceItems.length} ${sourceItems.length === 1 ? 'dish' : 'dishes'}`;
  }, [itemsLoading, sourceItems.length, totalCount]);

  const railStyle = headerOffset
    ? ({ '--rail-top': `${headerOffset + 12}px` } as CSSProperties)
    : undefined;

  return (
    <main id="main-content" className="page-main page-container">
      {/* On phones the app header carries the slim back / "Browse Menu" /
          search bar, so the page title block is desktop-only. */}
      <div className="hidden lg:block">
        <PageHeader
          eyebrow="Menu"
          title="Browse Menu"
          count={resultCountLabel}
          backHref="/"
          meta={
            lat != null && lng != null ? (
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                className="rounded-full font-semibold underline-offset-4 transition-colors hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
              >
                Within {radiusKm} km of your location
              </button>
            ) : (
              'Showing dishes from available restaurants'
            )
          }
        />
      </div>

      {/* Default `items-stretch`: the rail is sticky inside the aside, so the
          aside has to be as tall as the grid for the rail to have travel. */}
      <div className="flex gap-2.5 sm:gap-4 lg:gap-6">
        {/* ——— Categories ——— */}
        <aside className="category-rail-width shrink-0" style={railStyle}>
          {categoriesLoading ? (
            <CategoryRailSkeleton />
          ) : categories.length > 0 ? (
            <CategoryRail
              categories={categories}
              selectedKey={selectedKey}
              onSelect={handleCategorySelect}
              /* Clears the floating cart bar and bottom navigation on mobile so
                 the last category can always be scrolled into reach. */
              className="pb-28 md:pb-6"
            />
          ) : null}
        </aside>

        {/* ——— Dishes ——— */}
        <section ref={gridRef} className="min-w-0 flex-1" aria-label={`${categoryName} dishes`}>
          {/* Stacked on phones: the dish column is ~180px wide at 320px, which
              cannot hold a heading and both controls on one line. Wrapping (not
              horizontal scrolling) keeps the sort dropdown from being clipped. */}
          <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <h2 className="min-w-0 truncate text-[15px] font-extrabold text-ink sm:text-lg">
              {selectedKey === 'all' ? 'Showing all items' : categoryName}
            </h2>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
              <Chip
                active={vegOnly}
                onClick={() => setVegOnly((current) => !current)}
                aria-label="Show vegetarian dishes only"
                className="px-2.5 sm:px-4"
              >
                <VegIndicator vegetarian size="sm" />
                <span className="hidden sm:inline">Veg only</span>
              </Chip>

              <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} />
            </div>
          </div>

          {hasFilters && (
            <div className="mb-3">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}

          {categoriesError && categories.length === 0 ? (
            <ErrorState
              title="We couldn’t load the menu."
              message={categoriesError}
              onRetry={() => categoriesQuery.refetch()}
              retryLabel="Try Again"
            />
          ) : itemsLoading ? (
            <>
              <LoadingAnnouncement label="Loading dishes" />
              <CardGridSkeleton count={8} className={GRID_CLASSNAME} variant="compact" />
            </>
          ) : itemsError && sourceItems.length === 0 ? (
            <ErrorState
              title="We couldn’t load the menu."
              message={itemsError}
              onRetry={retryItems}
              retryLabel="Try Again"
            />
          ) : sourceItems.length === 0 ? (
            <EmptyState
              icon="dish"
              title={
                hasFilters
                  ? 'No dishes match these filters'
                  : 'No items available in this category'
              }
              description={
                hasFilters ? 'Try clearing your filters.' : 'Try another category.'
              }
              actionLabel={hasFilters ? 'Clear filters' : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          ) : (
            <>
              <div className={GRID_CLASSNAME}>
                {visibleItems.map((item, index) => (
                  <CategoryItemCard
                    key={`${item.restaurantId}-${item.itemId}`}
                    item={item}
                    onAdd={handleAddItem}
                    badge={offerBadges.get(`${item.restaurantId}-${item.itemId}`) ?? null}
                    priority={index < 4}
                    variant="compact"
                  />
                ))}
              </div>

              {hasMoreItems && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    size="md"
                    loading={loadingMore}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                  >
                    {loadingMore ? 'Loading' : 'Load more dishes'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <ItemCustomizeModal
        item={categoryMenuItem}
        restaurantId={customizeItem?.restaurantId ?? 0}
        restaurantName={customizeItem?.restaurantName ?? ''}
        restaurantSlug={customizeItem?.restaurantSlug}
        onClose={() => setCustomizeItem(null)}
      />
      <CartConflictModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        newRestaurantName={pendingItem?.restaurantName ?? ''}
        onCleared={handleCartCleared}
      />
      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </main>
  );
}

function isOfferCategory(category: HomeCategory) {
  const key = category.key.toLowerCase();
  const name = category.name.toLowerCase();
  return (
    category.categoryType?.toLowerCase() === 'offer' ||
    key === 'offer' ||
    key === 'offers' ||
    name === 'offer' ||
    name === 'offers'
  );
}

function mergeUniqueItems(currentItems: CategoryFoodItem[], nextItems: CategoryFoodItem[]) {
  const seen = new Set(currentItems.map((item) => `${item.restaurantId}-${item.itemId}`));
  const uniqueNextItems = nextItems.filter((item) => {
    const key = `${item.restaurantId}-${item.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...currentItems, ...uniqueNextItems];
}

function normalizeCategoryKey(value: string) {
  try {
    return decodeURIComponent(value).trim().toLowerCase() || 'all';
  } catch {
    return value.trim().toLowerCase() || 'all';
  }
}

function normalizeCategoryName(categoryKey: string, initialName?: string) {
  const name = initialName?.trim();
  if (name && categoryKey !== 'all') return name;
  if (categoryKey === 'all') return 'All';

  return categoryKey
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getErrorMessage(error: unknown) {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }
  return 'Something went wrong. Please try again.';
}
