'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CouponBanner } from '@/components/coupon/CouponBanner';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { RestaurantHero } from '@/components/restaurant/RestaurantHero';
import { RestaurantMenuLayout } from '@/components/restaurant/RestaurantMenuLayout';
import { RestaurantUnavailableBanner } from '@/components/restaurant/RestaurantUnavailableBanner';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { trackCampaignClick } from '@/services/marketingApi';
import { fetchRestaurantDetail, fetchRestaurantMenu, resolveRestaurantIdentifier } from '@/services/restaurantApi';
import { isCampaignContextExpired, normalizeCouponCode, useCampaignStore } from '@/store/campaignStore';
import { useCartStore } from '@/store/cartStore';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import { slugifyRestaurantName } from '@/utils/slug';
import type { RestaurantCategoryNavItem, RestaurantMenuFilters, RestaurantMenuSectionData } from '@/components/restaurant/restaurantMenuTypes';
import type { MenuCategory, MenuItem } from '@/types/menu';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantDetailPageProps {
  restaurantId?: string;
  slug?: string;
  locked?: boolean;
  campaignQuery?: Record<string, string | string[] | undefined>;
}

const DEFAULT_FILTERS: RestaurantMenuFilters = {
  vegOnly: false,
  bestsellers: false,
  ratingFourPlus: false,
};
const EMPTY_MENU: MenuCategory[] = [];

export function RestaurantDetailPage({
  restaurantId,
  slug,
  locked = false,
  campaignQuery,
}: RestaurantDetailPageProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filters, setFilters] = useState<RestaurantMenuFilters>(DEFAULT_FILTERS);
  const [activeCategoryKey, setActiveCategoryKey] = useState('recommended');
  const [favorite, setFavorite] = useState(false);
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingConflictItem, setPendingConflictItem] = useState<MenuItem | null>(null);

  const enterLockedMode = useRestaurantModeStore((state) => state.enterLockedMode);
  const exitLockedMode = useRestaurantModeStore((state) => state.exitLockedMode);
  const campaignContexts = useCampaignStore((state) => state.campaignContexts);
  const checkoutCoupons = useCampaignStore((state) => state.checkoutCoupons);
  const captureCampaignContext = useCampaignStore((state) => state.captureCampaignContext);
  const addItem = useCartStore((state) => state.addItem);
  const setCartRestaurant = useCartStore((state) => state.setRestaurant);
  const { toast } = useToast();
  const campaignParams = useMemo(
    () => parseCampaignQuery(campaignQuery),
    [campaignQuery]
  );

  const restaurantQuery = useQuery({
    queryKey: locked ? ['resolveRestaurant', slug] : ['restaurant', restaurantId],
    queryFn: () =>
      locked
        ? resolveRestaurantIdentifier(slug ?? '')
        : fetchRestaurantDetail(restaurantId ?? ''),
    enabled: locked ? Boolean(slug) : Boolean(restaurantId),
  });

  const restaurant = restaurantQuery.data ?? undefined;
  const menuRestaurantId = locked
    ? restaurant?.id
    : restaurant?.id || restaurantId;

  const menuQuery = useQuery({
    queryKey: ['menu', String(menuRestaurantId ?? '')],
    queryFn: () => fetchRestaurantMenu(menuRestaurantId ?? ''),
    enabled: Boolean(menuRestaurantId) && (!locked || Boolean(restaurant?.id)),
  });

  const currentRestaurantId = Number(restaurant?.id ?? restaurantId);
  const currentRestaurantSlug = restaurant?.slug ?? slug ?? slugifyRestaurantName(restaurant?.name ?? '');
  const orderingState = useMemo(() => getOrderingState(restaurant), [restaurant]);
  const activeCampaignContext =
    Number.isFinite(currentRestaurantId)
      ? campaignContexts[String(currentRestaurantId)]
      : undefined;
  const validCampaignContext =
    activeCampaignContext && !isCampaignContextExpired(activeCampaignContext)
      ? activeCampaignContext
      : undefined;
  const checkoutCoupon =
    Number.isFinite(currentRestaurantId)
      ? checkoutCoupons[String(currentRestaurantId)]
      : undefined;
  const bannerCouponCode =
    validCampaignContext?.couponCode ??
    (locked && campaignParams.couponCode ? campaignParams.couponCode : undefined);
  const bannerValidation =
    checkoutCoupon && checkoutCoupon.couponCode === bannerCouponCode
      ? checkoutCoupon.validation
      : undefined;

  useEffect(() => {
    if (locked && restaurant?.id) {
      enterLockedMode(
        restaurant.id,
        currentRestaurantSlug || String(restaurant.id),
        restaurant.name
      );
      return;
    }

    if (!locked) exitLockedMode();
  }, [currentRestaurantSlug, enterLockedMode, exitLockedMode, locked, restaurant]);

  useEffect(() => {
    if (!locked || !restaurant?.id || !campaignParams.hasContext) return;

    const context = {
      restaurantId: restaurant.id,
      restaurantSlug: currentRestaurantSlug || slug,
      couponCode: campaignParams.couponCode,
      campaignId: campaignParams.campaignId,
      utmSource: campaignParams.utmSource,
      utmCampaign: campaignParams.utmCampaign,
      sourceUrl: getCurrentSourceUrl(),
      capturedAt: Date.now(),
    };

    captureCampaignContext(context);
    void trackCampaignOpenOnce(context);
  }, [
    campaignParams.campaignId,
    campaignParams.couponCode,
    campaignParams.hasContext,
    campaignParams.utmCampaign,
    campaignParams.utmSource,
    captureCampaignContext,
    currentRestaurantSlug,
    locked,
    restaurant?.id,
    slug,
  ]);

  useEffect(() => {
    const handleHeaderSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string } | string>;
      const query =
        typeof customEvent.detail === 'string'
          ? customEvent.detail
          : customEvent.detail?.query ?? '';
      setSearch(query);
      window.setTimeout(() => {
        document.getElementById('restaurant-menu')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 20);
    };

    window.addEventListener('mangaale:menu-search', handleHeaderSearch as EventListener);
    return () => {
      window.removeEventListener('mangaale:menu-search', handleHeaderSearch as EventListener);
    };
  }, []);

  const menu = menuQuery.data ?? EMPTY_MENU;
  const menuCapabilities = useMemo(() => getMenuCapabilities(menu), [menu]);
  const sections = useMemo(
    () =>
      buildMenuSections(menu, debouncedSearch, filters, {
        hasBestsellerData: menuCapabilities.hasBestsellerData,
        hasRatingData: menuCapabilities.hasRatingData,
      }),
    [debouncedSearch, filters, menu, menuCapabilities.hasBestsellerData, menuCapabilities.hasRatingData]
  );
  const categories = useMemo(
    () => sections.map(sectionToCategoryNavItem),
    [sections]
  );
  const resolvedActiveCategoryKey = categories.some((category) => category.key === activeCategoryKey)
    ? activeCategoryKey
    : categories[0]?.key ?? 'recommended';

  const addSimpleItemToCart = useCallback(
    (item: MenuItem) => {
      if (!restaurant || !Number.isFinite(currentRestaurantId)) return;

      setCartRestaurant(currentRestaurantId, restaurant.name, currentRestaurantSlug);
      addItem({
        restaurant_id: currentRestaurantId,
        restaurant_name: restaurant.name,
        restaurant_slug: currentRestaurantSlug,
        item_id: item.id,
        name: item.name,
        image_url: item.image_url,
        quantity: 1,
        base_price: item.price,
        category_id: item.category_id,
        category_name: item.category_name,
        is_taxable: item.is_taxable,
        addons: [],
      });
      toast(`${item.name} added to cart`, 'success');
    },
    [addItem, currentRestaurantId, currentRestaurantSlug, restaurant, setCartRestaurant, toast]
  );

  const handleCustomize = useCallback(
    (item: MenuItem) => {
      if (orderingState.disabled) {
        toast(orderingState.reason, 'error');
        return;
      }
      setCustomizeItem(item);
    },
    [orderingState.disabled, orderingState.reason, toast]
  );

  const handleConflict = useCallback((item: MenuItem) => {
    setPendingConflictItem(item);
    setConflictOpen(true);
  }, []);

  const handleConflictClose = () => {
    setConflictOpen(false);
    setPendingConflictItem(null);
  };

  const handleConflictCleared = () => {
    if (!pendingConflictItem) return;

    if (hasCustomOptions(pendingConflictItem)) {
      setCustomizeItem(pendingConflictItem);
    } else {
      addSimpleItemToCart(pendingConflictItem);
    }

    setPendingConflictItem(null);
  };

  const handleShare = async () => {
    if (!restaurant) return;

    const shareSlug = currentRestaurantSlug || String(restaurant.id);
    const path = locked ? `/r/${slug ?? shareSlug}` : `/r/${shareSlug}`;
    const url = `${window.location.origin}${path}`;

    try {
      await navigator.clipboard?.writeText(url);
      toast('Restaurant link copied', 'success');
    } catch {
      toast('Could not copy the link', 'error');
    }
  };

  if (restaurantQuery.isLoading && !restaurant) {
    return <RestaurantDetailSkeleton />;
  }

  if (restaurantQuery.error || (!restaurantQuery.isLoading && !restaurant)) {
    return (
      <main className="min-h-screen bg-[#FFFDFD]">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <ErrorState
            title="Restaurant unavailable"
            message={
              locked
                ? 'This restaurant link is unavailable or has been removed.'
                : 'We could not find this restaurant.'
            }
            onRetry={() => restaurantQuery.refetch()}
          />
          <div className="mt-2 text-center">
            <Link
              href="/"
              className="inline-flex rounded-full border border-[#E6B8B8] px-5 py-2 text-sm font-bold text-[#A80F15] hover:bg-[#FFF0F0]"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!restaurant) return <RestaurantDetailSkeleton />;

  const loadedRestaurant = restaurant;
  const noResults = !menuQuery.isLoading && sections.length === 0;

  return (
    <main className="min-h-screen bg-[#FFFDFD] pb-16">
      <RestaurantHero
        restaurant={loadedRestaurant}
        loading={restaurantQuery.isLoading}
        favorite={favorite}
        onFavoriteToggle={() => setFavorite((value) => !value)}
        onShare={handleShare}
      />
      <RestaurantUnavailableBanner messages={orderingState.messages} />
      {locked && bannerCouponCode && (
        <CouponBanner couponCode={bannerCouponCode} validation={bannerValidation} />
      )}

      {menuQuery.error ? (
        <div className="mx-auto max-w-3xl px-4 py-14">
          <ErrorState
            title="Menu unavailable"
            message="We could not load this menu. Please try again."
            onRetry={() => menuQuery.refetch()}
          />
        </div>
      ) : (
        <RestaurantMenuLayout
          categories={categories}
          sections={sections}
          activeCategoryKey={resolvedActiveCategoryKey}
          onActiveCategoryChange={setActiveCategoryKey}
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
          hasBestsellerData={menuCapabilities.hasBestsellerData}
          hasRatingData={menuCapabilities.hasRatingData}
          loading={menuQuery.isLoading}
          noResults={noResults}
          restaurantId={currentRestaurantId}
          restaurantName={loadedRestaurant.name}
          restaurantSlug={currentRestaurantSlug}
          orderingDisabled={orderingState.disabled}
          disabledReason={orderingState.reason}
          onCustomize={handleCustomize}
          onConflict={handleConflict}
        />
      )}

      <RestaurantFooter locked={locked} lockedHref={`/r/${slug ?? currentRestaurantSlug}`} />

      <ItemCustomizeModal
        item={customizeItem}
        onClose={() => setCustomizeItem(null)}
        restaurantId={currentRestaurantId}
        restaurantName={loadedRestaurant.name}
        restaurantSlug={currentRestaurantSlug}
      />
      <CartConflictModal
        open={conflictOpen}
        onClose={handleConflictClose}
        newRestaurantName={loadedRestaurant.name}
        onCleared={handleConflictCleared}
      />
    </main>
  );
}

function parseCampaignQuery(query?: Record<string, string | string[] | undefined>) {
  const couponCode = normalizeCouponCode(readQueryValue(query?.coupon));
  const utmCampaign = readQueryValue(query?.utm_campaign);
  const campaignId =
    readNumericCampaignId(utmCampaign) ??
    readNumericCampaignId(readQueryValue(query?.campaign_id));
  const hasContext = Boolean(couponCode || campaignId || utmCampaign);

  return {
    couponCode,
    campaignId,
    utmSource: hasContext ? readQueryValue(query?.utm_source) || 'whatsapp' : undefined,
    utmCampaign,
    hasContext,
  };
}

function readQueryValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

function readNumericCampaignId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getCurrentSourceUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.pathname}${window.location.search}`;
}

async function trackCampaignOpenOnce(context: {
  restaurantId: number;
  campaignId?: number;
  couponCode?: string;
  utmSource?: string;
  sourceUrl?: string;
}) {
  if (typeof window === 'undefined') return;
  if (!context.campaignId && !context.couponCode) return;

  const key = `mangaale_campaign_click_tracked_${context.restaurantId}_${context.campaignId ?? 'none'}_${context.couponCode ?? 'none'}`;

  try {
    if (window.localStorage.getItem(key)) return;

    await trackCampaignClick({
      restaurant_id: context.restaurantId,
      campaign_id: context.campaignId,
      coupon_code: context.couponCode,
      source: context.utmSource,
      url: context.sourceUrl,
    });
    window.localStorage.setItem(key, '1');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.info('Campaign click tracking skipped', error);
    }
  }
}

function RestaurantDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#FFFDFD]">
      <RestaurantHero
        loading
        favorite={false}
        onFavoriteToggle={() => undefined}
        onShare={() => undefined}
      />
      <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <aside className="hidden lg:block">
          <div className="space-y-4 border-r border-[#F0DDDD] pr-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        </aside>
        <div className="space-y-5">
          <div className="flex gap-3">
            <Skeleton className="h-12 w-56 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <Skeleton className="h-8 w-56" />
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-[150px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}

function RestaurantFooter({ locked, lockedHref }: { locked: boolean; lockedHref: string }) {
  return (
    <footer className="mt-8 border-t border-[#E9CFCF] bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 py-9 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <Link
          href={locked ? lockedHref : '/'}
          className="text-3xl font-extrabold tracking-normal text-[#A80F15]"
        >
          Mangaale
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#6B4B4B] sm:text-base">
          {!locked && <Link href="/restaurants">Browse Menus</Link>}
          <Link href="/profile/orders">Track Order</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/help">Help Center</Link>
        </nav>
        <p className="text-sm text-[#7A6666]">{'\u00A9'} 2026 Mangaale. Culinary Excellence Delivered.</p>
      </div>
    </footer>
  );
}

function buildMenuSections(
  menu: MenuCategory[],
  query: string,
  filters: RestaurantMenuFilters,
  capabilities: { hasBestsellerData: boolean; hasRatingData: boolean }
): RestaurantMenuSectionData[] {
  const activeCategories = menu.filter((category) => category.is_active !== false);
  const allItems = activeCategories.flatMap((category) =>
    (category.items ?? []).map((item) => withCategoryFallback(item, category))
  );
  const normalizedQuery = query.trim().toLowerCase();
  const applyFilters = (item: MenuItem) =>
    matchesSearch(item, normalizedQuery) &&
    matchesFilters(item, filters, capabilities);

  const recommendedCandidates = allItems.filter(isRecommendedItem);
  const recommendedSource =
    recommendedCandidates.length > 0
      ? recommendedCandidates
      : allItems.filter((item) => item.is_available !== false).slice(0, 4);
  const recommendedItems = recommendedSource.filter(applyFilters);
  const sections: RestaurantMenuSectionData[] = [];

  if (recommendedItems.length > 0) {
    sections.push({
      key: 'recommended',
      title: 'Recommended',
      items: recommendedItems,
    });
  }

  for (const category of activeCategories) {
    const items = (category.items ?? [])
      .map((item) => withCategoryFallback(item, category))
      .filter(applyFilters);

    if (items.length === 0) continue;

    sections.push({
      key: String(category.id),
      title: category.name,
      category,
      categoryType: category.category_type,
      items,
    });
  }

  return sections;
}

function sectionToCategoryNavItem(section: RestaurantMenuSectionData): RestaurantCategoryNavItem {
  return {
    key: section.key,
    name: section.title,
    count: section.items.length,
    categoryType: section.categoryType,
  };
}

function withCategoryFallback(item: MenuItem, category: MenuCategory): MenuItem {
  if (item.category_id === category.id && item.category_name) return item;

  return {
    ...item,
    category_id: item.category_id ?? category.id,
    category_name: item.category_name ?? category.name,
  };
}

function getMenuCapabilities(menu: MenuCategory[]) {
  const items = menu.flatMap((category) => category.items ?? []);
  return {
    hasBestsellerData: items.some((item) => item.is_bestseller != null),
    hasRatingData: items.some((item) => item.rating != null),
  };
}

function matchesSearch(item: MenuItem, query: string) {
  if (!query) return true;
  return [item.name, item.description, item.category_name]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

function matchesFilters(
  item: MenuItem,
  filters: RestaurantMenuFilters,
  capabilities: { hasBestsellerData: boolean; hasRatingData: boolean }
) {
  if (filters.vegOnly && !isVegetarian(item)) return false;
  if (filters.bestsellers && capabilities.hasBestsellerData && item.is_bestseller !== true) return false;
  if (filters.ratingFourPlus && capabilities.hasRatingData && (item.rating ?? 0) < 4) return false;
  return true;
}

function isVegetarian(item: MenuItem) {
  if (item.is_vegetarian != null) return item.is_vegetarian;
  if (item.is_veg != null) return item.is_veg;
  const foodType = item.food_type?.toLowerCase();
  return foodType === 'veg' || foodType === 'vegetarian';
}

function isRecommendedItem(item: MenuItem) {
  return item.is_recommended === true || item.is_popular === true || item.is_bestseller === true;
}

function hasCustomOptions(item: MenuItem) {
  return (
    item.has_variants ||
    item.has_addons ||
    (item.variants?.length ?? 0) > 0 ||
    (item.addons?.length ?? 0) > 0
  );
}

function getOrderingState(restaurant?: Restaurant) {
  const messages: string[] = [];
  const status = restaurant?.status?.toLowerCase();

  if (
    restaurant?.is_active === false ||
    status === 'inactive' ||
    status === 'disabled'
  ) {
    messages.push('This restaurant is not accepting orders right now');
  }

  if (restaurant?.is_accepting_orders === false) {
    messages.push('This restaurant is not accepting orders right now');
  }

  if (restaurant?.is_open === false || status === 'closed') {
    messages.push('Closed right now');
  }

  const supportsDelivery = restaurant?.supports_delivery ?? restaurant?.delivery_available;
  if (supportsDelivery === false) {
    messages.push('Delivery is not available from this restaurant');
  }

  const uniqueMessages = Array.from(new Set(messages));

  return {
    messages: uniqueMessages,
    disabled: uniqueMessages.length > 0,
    reason: uniqueMessages[0] ?? 'This restaurant is not accepting orders right now.',
  };
}
