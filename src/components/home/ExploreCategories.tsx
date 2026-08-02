'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, MapPin } from 'lucide-react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CategoryItemsSection, CategoryItemsSkeleton } from '@/components/home/CategoryItemsSection';
import { CategoryPill } from '@/components/home/CategoryPill';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { LocationModal } from '@/components/location/LocationModal';
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
}

const RADIUS_KM = 7;
const HOME_ITEMS_LIMIT = 5;
const CATEGORY_PREVIEW_COUNT = 6;
const EMPTY_CATEGORIES: HomeCategory[] = [];

export function ExploreCategories({
  mode = 'global',
  lockedCategories,
  lockedRestaurant,
  className = '',
  embedded = false,
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

    if (categoryFromUrl && categories.some((category) => category.key === categoryFromUrl)) {
      return categoryFromUrl;
    }

    if (requestedCategoryKey && categories.some((category) => category.key === requestedCategoryKey)) {
      return requestedCategoryKey;
    }

    return categories.find((category) => category.key === 'all')?.key ?? categories[0]?.key ?? null;
  }, [categories, categoryFromUrl, requestedCategoryKey]);

  const selectedCategory = categories.find((category) => category.key === selectedCategoryKey);
  const hasExtraCategories = categories.length > CATEGORY_PREVIEW_COUNT;
  const visibleCategories = useMemo(() => {
    if (categoriesExpanded || !hasExtraCategories) return categories;

    const preview = categories.slice(0, CATEGORY_PREVIEW_COUNT);
    if (!selectedCategoryKey || preview.some((category) => category.key === selectedCategoryKey)) {
      return preview;
    }

    const selected = categories.find((category) => category.key === selectedCategoryKey);
    if (!selected) return preview;

    return [...preview.slice(0, CATEGORY_PREVIEW_COUNT - 1), selected];
  }, [categories, categoriesExpanded, hasExtraCategories, selectedCategoryKey]);

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
  const viewAllHref = useMemo(() => {
    if (effectiveMode !== 'global' || !selectedCategoryKey) return undefined;

    const query = new URLSearchParams();
    if (typeof lat === 'number' && Number.isFinite(lat)) query.set('lat', String(lat));
    if (typeof lng === 'number' && Number.isFinite(lng)) query.set('lng', String(lng));
    query.set('radius_km', String(RADIUS_KM));
    if (selectedCategoryName) query.set('name', selectedCategoryName);

    return `/categories/${encodeURIComponent(selectedCategoryKey)}?${query.toString()}`;
  }, [effectiveMode, lat, lng, selectedCategoryKey, selectedCategoryName]);

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
    setRequestedCategoryKey(category.key);
    updateCategoryInUrl(category.key);

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

  const categorySectionClassName = embedded
    ? className
    : `order-1 mx-auto mt-3 w-full max-w-7xl px-4 sm:mt-6 sm:px-6 lg:px-8 ${className}`;
  const itemsSectionClassName = embedded
    ? ''
    : 'order-4 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

  return (
    <>
      <motion.section
        className={categorySectionClassName}
        aria-labelledby="explore-categories-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="explore-categories-heading" className="sr-only text-2xl font-extrabold text-[#172033] sm:not-sr-only">
            Explore Categories
          </h2>
          {!categoriesLoading && !categoriesError && hasExtraCategories && (
            <button
              type="button"
              onClick={() => setCategoriesExpanded((expanded) => !expanded)}
              className="hidden shrink-0 text-sm font-bold text-[#16B8A6] transition hover:text-[#109F90] hover:underline sm:block"
              aria-expanded={categoriesExpanded}
            >
              {categoriesExpanded ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>

        {categoriesLoading ? (
          <CategoryPillsSkeleton />
        ) : categoriesError ? (
          <CategoryError message={categoriesError} onRetry={() => categoriesQuery.refetch()} />
        ) : categories.length === 0 ? (
          <CategoryEmpty
            hasLocation={hasLocation}
            mode={effectiveMode}
            onSetLocation={() => setLocationOpen(true)}
          />
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 hide-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {visibleCategories.map((category) => (
              <CategoryPill
                key={category.key}
                category={category}
                active={category.key === selectedCategoryKey}
                onClick={handleCategorySelect}
              />
            ))}
          </div>
        )}

        </div>
      </motion.section>

      {categoriesLoading ? (
        <section className={itemsSectionClassName} aria-label="Loading recommended dishes">
          <CategoryItemsSkeleton />
        </section>
      ) : selectedCategoryKey && categories.length > 0 ? (
          <div ref={itemsSectionRef} className={itemsSectionClassName}>
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
    <div className="flex gap-3 overflow-hidden pb-2">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Skeleton key={item} className="h-[82px] w-[66px] shrink-0 rounded-[18px]" />
      ))}
    </div>
  );
}

function CategoryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#E3E7EA] bg-white px-5 py-6 shadow-[0_12px_30px_rgba(23,32,51,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2] text-[#EF4444]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#172033]">Could not load categories</h3>
            <p className="mt-1 text-sm leading-6 text-[#737B8C]">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[#16B8A6] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#109F90]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function CategoryEmpty({
  hasLocation,
  mode,
  onSetLocation,
}: {
  hasLocation: boolean;
  mode: 'global' | 'locked';
  onSetLocation: () => void;
}) {
  const needsLocation = mode === 'global' && !hasLocation;

  return (
    <div className="rounded-2xl border border-[#E3E7EA] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(23,32,51,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F8F5] text-[#0E4B47]">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-[#172033]">
        {needsLocation ? 'Set your location to see nearby dishes.' : 'No categories available near you'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#737B8C]">
        {needsLocation ? 'Choose where to deliver and we will refresh nearby categories.' : 'Try changing your location.'}
      </p>
      {mode === 'global' && (
        <button
          type="button"
          onClick={onSetLocation}
          className="mt-5 rounded-full bg-[#16B8A6] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#109F90]"
        >
          {hasLocation ? 'Change location' : 'Set location'}
        </button>
      )}
    </div>
  );
}

function normalizeCategoryParam(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
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
