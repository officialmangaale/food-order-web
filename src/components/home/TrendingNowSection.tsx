'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CardRail, HomeSection } from '@/components/home/HomeSection';
import { TrendingItemCard } from '@/components/home/TrendingItemCard';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { MediaCardSkeleton } from '@/components/ui/Skeleton';
import { useTrendingItems } from '@/hooks/useTrendingItems';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import { trendingItemToMenuItem } from '@/utils/trendingAdapter';
import type { TrendingItem } from '@/types/trending';

const HOME_TRENDING_LIMIT = 6;
const HOME_TRENDING_VISIBLE = 3;
const RADIUS_KM = 7;
const WINDOW_DAYS = 7;

export function TrendingNowSection() {
  const pathname = usePathname();
  const isLockedRoute = pathname.startsWith('/r/');
  const lockedRestaurantId = useRestaurantModeStore((state) => state.lockedRestaurantId);
  const lat = useLocationStore((state) => state.latitude);
  const lng = useLocationStore((state) => state.longitude);
  const [customizeItem, setCustomizeItem] = useState<TrendingItem | null>(null);
  const [pendingItem, setPendingItem] = useState<TrendingItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const isDifferentRestaurant = useCartStore((state) => state.isDifferentRestaurant);

  const trendingQuery = useTrendingItems({
    lat,
    lng,
    radiusKm: RADIUS_KM,
    windowDays: WINDOW_DAYS,
    limit: HOME_TRENDING_LIMIT,
    lockedRestaurantId,
    enabled: !isLockedRoute,
  });

  const items = trendingQuery.data?.items ?? [];
  const visibleItems = items.slice(0, HOME_TRENDING_VISIBLE);
  const total = trendingQuery.data?.meta.total;
  const hasMoreItems = Boolean(
    items.length > HOME_TRENDING_VISIBLE ||
      trendingQuery.data?.meta.hasMore ||
      (total != null && total > HOME_TRENDING_VISIBLE)
  );
  const viewAllHref = useMemo(() => {
    const query = new URLSearchParams();
    if (typeof lat === 'number' && Number.isFinite(lat)) query.set('lat', String(lat));
    if (typeof lng === 'number' && Number.isFinite(lng)) query.set('lng', String(lng));
    query.set('radius_km', String(RADIUS_KM));
    query.set('window_days', String(WINDOW_DAYS));
    return `/trending?${query.toString()}`;
  }, [lat, lng]);
  const categoryMenuItem = customizeItem ? trendingItemToMenuItem(customizeItem) : null;

  const addItemDirectly = (item: TrendingItem) => {
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

  const hasCustomOptions = (item: TrendingItem) =>
    Boolean(
      item.hasVariants ||
        item.hasAddons ||
        (item.variants?.length ?? 0) > 0 ||
        (item.addons?.length ?? 0) > 0
    );

  const handleAddItem = (item: TrendingItem) => {
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

  if (isLockedRoute) return null;
  // Trending is supplementary — stay silent rather than showing an empty rail.
  if (!trendingQuery.isLoading && !trendingQuery.error && visibleItems.length === 0) return null;

  return (
    <HomeSection
      id="trending-now"
      title="Trending favourites"
      viewAllHref={hasMoreItems ? viewAllHref : undefined}
    >
      {trendingQuery.isLoading ? (
        <CardRail>
          {Array.from({ length: HOME_TRENDING_VISIBLE }, (_, index) => (
            <MediaCardSkeleton key={index} />
          ))}
        </CardRail>
      ) : trendingQuery.error && items.length === 0 ? (
        <ErrorState
          title="Trending dishes are unavailable"
          message="Please try again in a moment."
          onRetry={() => trendingQuery.refetch()}
        />
      ) : (
        <CardRail itemWidth="w-[168px]">
          {visibleItems.map((item) => (
            <TrendingItemCard
              key={`${item.restaurantId}-${item.itemId}`}
              item={item}
              onAdd={handleAddItem}
            />
          ))}
        </CardRail>
      )}

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
    </HomeSection>
  );
}
