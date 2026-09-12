'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { CouponBanner } from '@/components/coupon/CouponBanner';
import { fetchRestaurantDetail, fetchRestaurantMenu, resolveRestaurantIdentifier } from '@/services/restaurantApi';
import { trackCampaignClick } from '@/services/marketingApi';
import { isCampaignContextExpired, normalizeCouponCode, useCampaignStore } from '@/store/campaignStore';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import { slugifyRestaurantName } from '@/utils/slug';
import type { Restaurant } from '@/types/restaurant';
import { RestaurantScreen } from './RestaurantScreen';
import { RestaurantMenuExperience } from './RestaurantMenuExperience';
import { hasRestaurantBackEntry } from './useRestaurantPanels';
import styles from './RestaurantExperience.module.css';

interface RestaurantDetailPageProps {
  restaurantId?: string;
  slug?: string;
  locked?: boolean;
  campaignQuery?: Record<string, string | string[] | undefined>;
}

export function RestaurantDetailPage({ restaurantId, slug, locked = false, campaignQuery }: RestaurantDetailPageProps) {
  const router = useRouter();
  const enterLockedMode = useRestaurantModeStore((state) => state.enterLockedMode);
  const exitLockedMode = useRestaurantModeStore((state) => state.exitLockedMode);
  const campaignContexts = useCampaignStore((state) => state.campaignContexts);
  const checkoutCoupons = useCampaignStore((state) => state.checkoutCoupons);
  const captureCampaignContext = useCampaignStore((state) => state.captureCampaignContext);
  const campaignParams = useMemo(() => parseCampaignQuery(campaignQuery), [campaignQuery]);
  const restaurantQuery = useQuery({
    queryKey: locked ? ['resolveRestaurant', slug] : ['restaurant', restaurantId],
    queryFn: () => locked ? resolveRestaurantIdentifier(slug ?? '') : fetchRestaurantDetail(restaurantId ?? ''),
    enabled: locked ? Boolean(slug) : Boolean(restaurantId),
  });
  const restaurant = restaurantQuery.data ?? undefined;
  const menuRestaurantId = locked ? restaurant?.id : restaurant?.id || restaurantId;
  const menuQuery = useQuery({
    queryKey: ['menu', String(menuRestaurantId ?? '')],
    queryFn: () => fetchRestaurantMenu(menuRestaurantId ?? ''),
    enabled: Boolean(menuRestaurantId) && (!locked || Boolean(restaurant?.id)),
  });
  const currentRestaurantId = Number(restaurant?.id ?? restaurantId);
  const currentRestaurantSlug = restaurant?.slug ?? slug ?? slugifyRestaurantName(restaurant?.name ?? '');
  const orderingState = useMemo(() => getOrderingState(restaurant), [restaurant]);
  const activeCampaignContext = Number.isFinite(currentRestaurantId) ? campaignContexts[String(currentRestaurantId)] : undefined;
  const validCampaignContext = activeCampaignContext && !isCampaignContextExpired(activeCampaignContext) ? activeCampaignContext : undefined;
  const checkoutCoupon = Number.isFinite(currentRestaurantId) ? checkoutCoupons[String(currentRestaurantId)] : undefined;
  const bannerCouponCode = validCampaignContext?.couponCode ?? (locked && campaignParams.couponCode ? campaignParams.couponCode : undefined);
  const bannerValidation = checkoutCoupon?.couponCode === bannerCouponCode ? checkoutCoupon?.validation : undefined;

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


  return <RestaurantScreen>
    {restaurant ? <RestaurantMenuExperience key={restaurant.id} restaurant={restaurant}
      restaurantSlug={currentRestaurantSlug} menu={menuQuery.data}
      loading={menuQuery.isLoading} error={menuQuery.error} onRetry={() => menuQuery.refetch()}
      orderingDisabled={orderingState.disabled} disabledReason={orderingState.reason}
      campaignBanner={locked && bannerCouponCode ? <CouponBanner couponCode={bannerCouponCode} validation={bannerValidation} /> : undefined}
    /> : <main id="main-content" className={styles.status}>
      <button className={styles.back} onClick={() => hasRestaurantBackEntry() ? router.back() : router.replace('/')}><ArrowLeft size={20} />Back</button>
      {restaurantQuery.isLoading ? <><div className={styles.skeleton} /><h1>Loading restaurant…</h1></> :
        <><h1>Restaurant unavailable</h1><p>We could not load this restaurant. Please try again.</p><button className={styles.primary} onClick={() => restaurantQuery.refetch()}>Try again</button></>}
    </main>}
  </RestaurantScreen>;
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
