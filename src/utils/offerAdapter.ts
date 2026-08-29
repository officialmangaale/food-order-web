import type { HomeMenuOffer, RawMenuOffer } from '@/types/offer';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { formatMoney } from '@/utils/money';

export function normalizeMenuOffer(raw: RawMenuOffer): HomeMenuOffer | null {
  if (!raw || typeof raw !== 'object') return null;

  const categoryType = getString(raw.category_type);
  if (categoryType && categoryType.toLowerCase() !== 'offer') return null;
  if (raw.is_available === false) return null;
  if (raw.schedule?.is_active_now === false) return null;

  const restaurantId = toNumber(raw.restaurant_id);
  if (restaurantId == null) return null;

  const categoryId = toNumber(raw.category_id);
  const offerItemId = toNumber(raw.offer_item_id) ?? toNumber(raw.item_id);
  const restaurantName = getString(raw.restaurant_name) ?? 'Mangaale Restaurant';
  const title =
    getString(raw.title) ??
    getString(raw.name) ??
    getString(raw.category_name) ??
    'Special Offer';
  const subtitle =
    getString(raw.subtitle) ??
    getString(raw.description) ??
    `Special offer from ${restaurantName}`;
  const price = toNumber(raw.price);
  const displayPrice = getString(raw.display_price) ?? (price != null ? formatMoney(price) : undefined);

  return {
    id: String(offerItemId ?? `${restaurantId}-${categoryId ?? 'category'}-${title}`),
    offerItemId,
    categoryId,
    restaurantId,
    restaurantName,
    restaurantSlug: getString(raw.restaurant_slug),
    title,
    subtitle,
    description: getString(raw.description),
    price,
    displayPrice,
    imageUrl: normalizeImageUrl(raw.image_url ?? raw.background_url),
    fallbackImageUrl: normalizeImageUrl(raw.fallback_image_url),
    badgeText: getString(raw.badge_text) ?? getString(raw.category_name) ?? 'Exclusive Offer',
    ctaText: getString(raw.cta_text) ?? 'Order Now',
    ctaUrl: getString(raw.cta_url) ?? `/restaurants/${restaurantId}`,
    categoryName: getString(raw.category_name),
    distanceKm: toNumber(raw.distance_km),
    deliveryTime: getString(raw.delivery_time),
    isRestaurantOpen: raw.restaurant_is_open,
    isAvailable: raw.is_available,
    // Passed through only when the backend classifies the dish, never inferred.
    isVegetarian: typeof raw.is_vegetarian === 'boolean' ? raw.is_vegetarian : undefined,
  };
}

export function normalizeHomeMenuOffersResponse(response: unknown): HomeMenuOffer[] {
  return extractOfferArray(response)
    .map((raw) => normalizeMenuOffer(raw as RawMenuOffer))
    .filter((offer): offer is HomeMenuOffer => Boolean(offer));
}

export const normalizeHomeOffersResponse = normalizeHomeMenuOffersResponse;
export const normalizeHomeOffer = normalizeMenuOffer;

function extractOfferArray(response: unknown): unknown[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response !== 'object') return [];

  const root = response as Record<string, unknown>;
  const data = getRecord(root.data);
  const nestedData = getRecord(data?.data);

  return (
    pickArray(root.offers) ??
    pickArray(data?.offers) ??
    pickArray(nestedData?.offers) ??
    []
  );
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function pickArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
