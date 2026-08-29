'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CategoryItemsSection, CategoryItemsSkeleton } from '@/components/home/CategoryItemsSection';
import { CategoryPill } from '@/components/home/CategoryPill';
import { HomeSection } from '@/components/home/HomeSection';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { LocationModal } from '@/components/location/LocationModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategoryItems } from '@/hooks/useCategoryItems';
import { useExploreCategories } from '@/hooks/useExploreCategories';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import {
  buildLockedCategories,
  buildLockedCategoryItemsResult,
  categoryItemToMenuItem,
  type LockedRestaurantCategorySource,
} from '@/utils/categoryAdapter';
import type { CategoryFoodItem, CategoryItemsResult, HomeCategory } from '@/types/category';
import type { MenuCategory } from '@/types/menu';

interface ExploreCategoriesProps {
  mode?: 'global' | 'locked';
  lockedCategories?: MenuCategory[];
  lockedRestaurant?: LockedRestaurantCategorySource;
  className?: string;
  embedded?: boolean;
  betweenCategoriesAndItems?: ReactNode;
}

const RADIUS_KM = 7;
const HOME_ITEMS_LIMIT = 5;
const EMPTY_CATEGORIES: HomeCategory[] = [];

export function ExploreCategories({
  mode = 'global',
  lockedCategories,
  lockedRestaurant,
  className = '',
  embedded = false,
  betweenCategoriesAndItems,
}: ExploreCategoriesProps) {
  const pathname = usePathname();
  const effectiveMode = pathname.startsWith('/r/') ? 'locked' : mode;
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = normalizeCategoryParam(searchParams.get('category'));
  const [requestedCategoryKey, setRequestedCategoryKey] = useState<string | null>(categoryFromUrl);
  const [customizeItem, setCustomizeItem] = useState<CategoryFoodItem | null>(null);
  const [pendingItem, setPendingItem] = useState<CategoryFoodItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const itemsSectionRef = useRef<HTMLDivElement | null>(null);

  const lat = useLocationStore((state) => state.latitude);
  const lng = useLocationStore((state) => state.longitude);

  const addItem = useCartStore((state) => state.addItem);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const isDifferentRestaurant = useCartStore((state) => state.isDifferentRestaurant);

  const categoriesQuery = useExploreCategories({
    lat,
    lng,
    radiusKm: RADIUS_KM,
    includeAll: true,
    enabled: effectiveMode === 'global',
  });

  const lockedCategoryList = useMemo(
    () => buildLockedCategories(lockedCategories),
    [lockedCategories]
  );

  const globalCategoryList = categoriesQuery.data ?? EMPTY_CATEGORIES;
  const categories = useMemo(
    () => (effectiveMode === 'locked' ? lockedCategoryList : globalCategoryList),
    [effectiveMode, globalCategoryList, lockedCategoryList]
  );

  const selectedCategoryKey = useMemo(() => {
    if (!categories.length) return null;

    const routeCategory = findRequestedCategory(categories, categoryFromUrl);
    if (routeCategory) {
      return routeCategory.key;
    }

    if (requestedCategoryKey && categories.some((category) => category.key === requestedCategoryKey)) {
      return requestedCategoryKey;
    }

    return categories.find((category) => category.key === 'all')?.key ?? categories[0]?.key ?? null;
  }, [categories, categoryFromUrl, requestedCategoryKey]);

  const selectedCategory = categories.find((category) => category.key === selectedCategoryKey);
  const categoryGridExpanded = categoriesExpanded || Boolean(categoryFromUrl);

  const itemsQuery = useCategoryItems({
    categoryKey: selectedCategoryKey,
    lat,
    lng,
    radiusKm: RADIUS_KM,
    page: 1,
    limit: HOME_ITEMS_LIMIT,
    sort: 'recommended',
    vegOnly: false,
    enabled: effectiveMode === 'global' && Boolean(selectedCategoryKey),
  });

  const lockedItemsResult = useMemo<CategoryItemsResult>(
    () =>
      lockedRestaurant
        ? buildLockedCategoryItemsResult({
            selectedCategoryKey,
            menu: lockedCategories,
            restaurant: lockedRestaurant,
          })
        : createEmptyCategoryItemsResult(),
    [lockedCategories, lockedRestaurant, selectedCategoryKey]
  );

  const itemsResult = effectiveMode === 'locked' ? lockedItemsResult : itemsQuery.data;
  const items = itemsResult?.items ?? [];
  const categoryMenuItem = customizeItem ? categoryItemToMenuItem(customizeItem) : null;
  const categoriesLoading = effectiveMode === 'global' && categoriesQuery.isLoading;
  const itemsLoading = effectiveMode === 'global' && Boolean(selectedCategoryKey) && itemsQuery.isLoading;
  const categoriesError = effectiveMode === 'global' ? getErrorMessage(categoriesQuery.error) : '';
  const itemsError = effectiveMode === 'global' ? getErrorMessage(itemsQuery.error) : '';
  const hasLocation = lat != null && lng != null;
  const selectedCategoryName = selectedCategory?.name;
  /** Link into the Browse Menu screen, carrying the current location context. */
  const buildBrowseMenuHref = useCallback(
    (categoryKey: string, categoryName?: string) => {
      const query = new URLSearchParams();
      if (typeof lat === 'number' && Number.isFinite(lat)) query.set('lat', String(lat));
      if (typeof lng === 'number' && Number.isFinite(lng)) query.set('lng', String(lng));
      query.set('radius_km', String(RADIUS_KM));
      if (categoryName) query.set('name', categoryName);

      return `/categories/${encodeURIComponent(categoryKey)}?${query.toString()}`;
    },
    [lat, lng]
  );

  const viewAllHref = useMemo(() => {
    if (effectiveMode !== 'global' || !selectedCategoryKey) return undefined;
    return buildBrowseMenuHref(selectedCategoryKey, selectedCategoryName);
  }, [buildBrowseMenuHref, effectiveMode, selectedCategoryKey, selectedCategoryName]);

  const updateCategoryInUrl = useCallback(
    (categoryKey: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (categoryKey === 'all') next.delete('category');
      else next.set('category', categoryKey);

      const nextString = next.toString();
      router.replace(`${pathname}${nextString ? `?${nextString}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleCategorySelect = (category: HomeCategory) => {
    /* On home, All opens the dedicated Browse Menu screen rather than expanding
       the strip in place. `push` keeps a history entry, so the browser back
       button and the screen's own back link both return here. A locked
       restaurant menu has no Browse Menu screen and keeps expanding inline. */
    if (category.key === 'all' && effectiveMode === 'global') {
      router.push(buildBrowseMenuHref(category.key, category.name));
      return;
    }

    setRequestedCategoryKey(category.key);
    updateCategoryInUrl(category.key);

    if (category.key === 'all') {
      setCategoriesExpanded(!categoryGridExpanded);
      return;
    }

    window.setTimeout(() => {
      itemsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
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
    Boolean(item.hasVariants || item.hasAddons || (item.variants?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0);

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

  return (
    <>
      <HomeSection
        id="explore-categories"
        title="What are you craving?"
        description="Pick a category to see dishes near you"
        hideTitle={effectiveMode === 'global'}
        embedded={embedded}
        className={embedded ? className : undefined}
      >
        {categoriesLoading ? (
          <CategoryPillsSkeleton />
        ) : categoriesError ? (
          <ErrorState
            title="Could not load categories"
            message={categoriesError}
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="location"
            title={
              effectiveMode === 'global' && !hasLocation
                ? 'Set your location to see nearby dishes'
                : 'No categories available near you'
            }
            description={
              effectiveMode === 'global' && !hasLocation
                ? 'Choose where to deliver and we will refresh nearby categories.'
                : 'Try changing your location.'
            }
            actionLabel={
              effectiveMode === 'global' ? (hasLocation ? 'Change location' : 'Set location') : undefined
            }
            onAction={effectiveMode === 'global' ? () => setLocationOpen(true) : undefined}
          />
        ) : (
          <>
            <motion.div
              layout
              role="radiogroup"
              aria-label="Food categories"
              data-expanded={categoryGridExpanded}
              className="category-grid"
              transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
            >
              {categories.map((category) => (
                <CategoryPill
                  key={category.key}
                  category={category}
                  active={category.key === selectedCategoryKey}
                  onClick={handleCategorySelect}
                  /* Only a disclosure in locked mode; on home All navigates. */
                  expanded={
                    category.key === 'all' && effectiveMode !== 'global'
                      ? categoryGridExpanded
                      : undefined
                  }
                />
              ))}
            </motion.div>
          </>
        )}
      </HomeSection>

      {betweenCategoriesAndItems}

      {categoriesLoading ? (
        <section
          className={embedded ? '' : 'page-container page-section'}
          aria-label="Loading recommended dishes"
        >
          <CategoryItemsSkeleton />
        </section>
      ) : selectedCategoryKey && categories.length > 0 ? (
        <div ref={itemsSectionRef} className={embedded ? '' : 'page-container page-section'}>
          <CategoryItemsSection
            selectedCategory={selectedCategory}
            items={items}
            pagination={itemsResult?.pagination}
            totalCount={itemsResult?.totalCount}
            loading={itemsLoading}
            errorMessage={itemsError}
            hasLocation={hasLocation}
            mode={effectiveMode}
            viewAllHref={viewAllHref}
            onRetry={() => itemsQuery.refetch()}
            onAddItem={handleAddItem}
            onSetLocation={() => setLocationOpen(true)}
          />
        </div>
      ) : null}

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
      {effectiveMode === 'global' && (
        <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      )}
    </>
  );
}

function CategoryPillsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden pb-1" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="w-[70px] shrink-0">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mt-2 h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function normalizeCategoryParam(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function findRequestedCategory(categories: HomeCategory[], requestedKey: string | null) {
  if (!requestedKey) return undefined;

  const exact = categories.find((category) => category.key === requestedKey);
  if (exact) return exact;

  if (requestedKey === 'offer' || requestedKey === 'offers') {
    return categories.find((category) => {
      const key = category.key.toLowerCase();
      const name = category.name.toLowerCase();
      const type = category.categoryType?.toLowerCase();
      return key === 'offer' || key === 'offers' || name === 'offer' || name === 'offers' || type === 'offer';
    });
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }
  return 'Something went wrong. Please try again.';
}

function createEmptyCategoryItemsResult(): CategoryItemsResult {
  return {
    items: [],
    pagination: {
      page: 1,
      limit: HOME_ITEMS_LIMIT,
      hasMore: false,
      totalCount: 0,
    },
    totalCount: 0,
    warnings: [],
  };
}
