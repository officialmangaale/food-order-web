import { formatDistance } from '@/utils/distance';
import { normalizeImageUrl } from '@/utils/imageUrl';
import type { NearbyRestaurantsResult, RestaurantCardData } from '@/types/restaurant';

const DEFAULT_RADIUS_KM = 7;
const RADIUS_TOLERANCE_KM = 0.05;

export function normalizeNearbyRestaurantsResult(
  raw: unknown,
  options: { hasLocation?: boolean; radiusKm?: number } = {}
): NearbyRestaurantsResult {
  const radiusKm = options.radiusKm ?? DEFAULT_RADIUS_KM;
  const payload = extractDataPayload(raw);
  const obj = asRecord(payload);
  const itemsRaw = Array.isArray(payload)
    ? payload
    : obj
      ? obj.items ?? obj.restaurants ?? obj.results
      : [];
  const meta = normalizeMeta(obj?.meta, radiusKm);
  const restaurants = normalizeRestaurantCards(itemsRaw, {
    hasLocation: options.hasLocation,
    radiusKm,
  });

  return {
    restaurants,
    meta,
  };
}

export function normalizeRestaurantCards(
  rawItems: unknown,
  options: { hasLocation?: boolean; radiusKm?: number } = {}
): RestaurantCardData[] {
  if (!Array.isArray(rawItems)) return [];

  const radiusKm = options.radiusKm ?? DEFAULT_RADIUS_KM;
  const unique = new Map<number, RestaurantCardData>();

  for (const raw of rawItems) {
    const restaurant = normalizeRestaurantCard(raw);
    if (!restaurant) continue;

    if (options.hasLocation) {
      if (restaurant.distanceKm == null) continue;
      if (restaurant.distanceKm > radiusKm + RADIUS_TOLERANCE_KM) continue;
    }

    if (!unique.has(restaurant.id)) unique.set(restaurant.id, restaurant);
  }

  return Array.from(unique.values()).sort((a, b) => {
    const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (distanceA !== distanceB) return distanceA - distanceB;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

export function normalizeRestaurantCard(raw: unknown): RestaurantCardData | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const id = readNumber(obj.id ?? obj.restaurant_id ?? obj.restaurantId);
  const name = readString(obj.name ?? obj.restaurant_name ?? obj.restaurantName);
  if (!id || !name) return null;

  const tags = readStringArray(obj.tags);
  const distanceKm = readDistanceKm(obj.distance_km ?? obj.distanceKm, obj.distance);
  const rawDeliveryTime = obj.delivery_time ?? obj.deliveryTime ?? obj.estimated_delivery_time;
  const minDeliveryTime = readNumber(
    obj.min_delivery_time ?? obj.minDeliveryTime ?? obj.min_delivery_minutes ?? obj.minDeliveryMinutes
  );
  const maxDeliveryTime = readNumber(
    obj.max_delivery_time ?? obj.maxDeliveryTime ?? obj.max_delivery_minutes ?? obj.maxDeliveryMinutes
  );
  const category = readString(obj.category);
  const cuisine = readString(obj.cuisine ?? obj.cuisine_type ?? obj.cuisineType) ?? category ?? tags?.[0];
  const rating = readNumber(obj.rating ?? obj.average_rating ?? obj.averageRating);
  const supportsDelivery = readBoolean(obj.supports_delivery ?? obj.delivery_available ?? obj.deliveryAvailable);
  const offerBadge =
    readString(obj.offer_badge ?? obj.offerBadge ?? obj.promo_badge ?? obj.promoBadge) ??
    (readBoolean(obj.free_delivery ?? obj.freeDelivery) || readNumber(obj.delivery_fee ?? obj.deliveryFee) === 0
      ? 'FREE DELIVERY'
      : undefined);

  const backgroundImageUrl = normalizeImageUrl(obj.background_image_url ?? obj.backgroundImageUrl);
  const imageUrl =
    backgroundImageUrl ??
    normalizeImageUrl(obj.image_url ?? obj.imageUrl) ??
    normalizeImageUrl(obj.logo_url ?? obj.logoUrl);

  return {
    id,
    name,
    slug: readString(obj.slug ?? obj.restaurant_slug ?? obj.restaurantSlug),
    category,
    cuisine,
    rating: rating && rating > 0 ? rating : undefined,
    reviewCount: readNumber(obj.review_count ?? obj.reviewCount ?? obj.total_ratings ?? obj.totalRatings),
    deliveryTime: sanitizeDeliveryTime(rawDeliveryTime, distanceKm, minDeliveryTime, maxDeliveryTime),
    distance: readString(obj.distance) ?? (distanceKm != null ? formatDistance(distanceKm) : undefined),
    distanceKm,
    imageUrl,
    backgroundImageUrl,
    tags,
    address: readString(obj.address ?? obj.full_address ?? obj.fullAddress),
    offerBadge,
    isOpen: readBoolean(obj.is_open ?? obj.isOpen ?? obj.open),
    supportsDelivery,
  };
}

function normalizeMeta(raw: unknown, radiusKm: number) {
  const obj = asRecord(raw);

  return {
    total: readNumber(obj?.total ?? obj?.total_count ?? obj?.totalCount),
    page: readNumber(obj?.page) ?? 1,
    limit: readNumber(obj?.limit) ?? 20,
    hasMore: readBoolean(obj?.has_more ?? obj?.hasMore) ?? false,
    radiusKm,
  };
}

function sanitizeDeliveryTime(
  value: unknown,
  distanceKm: number | undefined,
  minDeliveryTime?: number,
  maxDeliveryTime?: number
) {
  if (minDeliveryTime != null || maxDeliveryTime != null) {
    const min = minDeliveryTime ?? maxDeliveryTime;
    const max = maxDeliveryTime ?? minDeliveryTime;
    if (min != null && max != null && min > 0 && max > 0 && min <= 120 && max <= 120) {
      return min === max ? `${min} min` : `${Math.min(min, max)}–${Math.max(min, max)} min`;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 && value <= 120 ? `${value} min` : estimateDeliveryTime(distanceKm);
  }

  if (typeof value !== 'string' || !value.trim()) return estimateDeliveryTime(distanceKm);

  const normalizedValue = value.trim();

  const numbers = normalizedValue.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  const largestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  if (largestNumber > 120 || normalizedValue.includes('970')) {
    return estimateDeliveryTime(distanceKm);
  }

  if (numbers.length === 1 && /^\s*\d+\s*$/.test(normalizedValue)) {
    return `${numbers[0]} min`;
  }

  return normalizedValue
    .replace(/\bmins?\b/gi, 'min')
    .replace(/(\d)\s*(?:-|–|—|to)\s*(\d)/i, '$1–$2');
}

function estimateDeliveryTime(distanceKm: number | undefined) {
  if (distanceKm == null) return undefined;
  if (distanceKm <= 2) return '20–30 min';
  if (distanceKm <= 5) return '30–40 min';
  return '40–50 min';
}

function readDistanceKm(primary: unknown, fallbackDistance: unknown) {
  const direct = readNumber(primary);
  if (direct != null) return direct;

  if (typeof fallbackDistance === 'number') return fallbackDistance;
  if (typeof fallbackDistance !== 'string') return undefined;

  const normalized = fallbackDistance.trim().toLowerCase();
  const numericValue = readNumber(normalized.replace(/[^\d.]/g, ''));
  if (numericValue == null) return undefined;

  if (normalized.includes('km')) return numericValue;
  if (normalized.includes('m')) return numericValue / 1000;
  return numericValue;
}

function extractDataPayload(raw: unknown): unknown {
  const obj = asRecord(raw);
  if (!obj) return raw;

  const firstData = obj.data;
  const firstDataObj = asRecord(firstData);
  if (firstDataObj && 'data' in firstDataObj) return firstDataObj.data;
  if (firstData !== undefined) return firstData;

  return raw;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
  return strings.length > 0 ? strings : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
