import { restaurantGet } from './http';
import { unwrapApiResponse, normalizeRestaurant, normalizeRestaurantMenu } from '@/utils/apiAdapters';
import { normalizeNearbyRestaurantsResult } from '@/utils/restaurantAdapter';
import type { NearbyRestaurantsResult, Restaurant, HomeFeedResponse } from '@/types/restaurant';
import type { MenuCategory } from '@/types/menu';

/** GET /api/home?lat=&lng= */
export async function fetchHomeFeed(lat?: number, lng?: number): Promise<HomeFeedResponse> {
  const params = new URLSearchParams();
  if (lat != null) params.set('lat', String(lat));
  if (lng != null) params.set('lng', String(lng));
  const qs = params.toString();
  const raw = await restaurantGet<unknown>(`/api/home${qs ? `?${qs}` : ''}`);
  return unwrapApiResponse<HomeFeedResponse>(raw);
}

/** GET /api/restaurants?lat=&lng=&radius_km=7&page=1&limit=20 */
export async function fetchNearbyRestaurants(
  lat: number, lng: number,
  page = 1, limit = 20
): Promise<Restaurant[]> {
  const raw = await restaurantGet<unknown>(
    `/api/restaurants?lat=${lat}&lng=${lng}&radius_km=7&page=${page}&limit=${limit}`
  );
  const data = unwrapApiResponse<unknown>(raw);
  const arr = Array.isArray(data) ? data : (data as Record<string, unknown>).restaurants ?? (data as Record<string, unknown>).items ?? [];
  return (arr as Record<string, unknown>[]).map(normalizeRestaurant);
}

export async function getNearbyRestaurants(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}): Promise<NearbyRestaurantsResult> {
  const radiusKm = params.radiusKm ?? 7;
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const query = new URLSearchParams();
  query.set('lat', String(params.lat));
  query.set('lng', String(params.lng));
  query.set('radius_km', String(radiusKm));
  query.set('page', String(page));
  query.set('limit', String(limit));

  try {
    const raw = await restaurantGet<unknown>(`/api/restaurants?${query.toString()}`);
    return normalizeNearbyRestaurantsResult(raw, {
      hasLocation: true,
      radiusKm,
    });
  } catch (error) {
    throw new Error(toNearbyRestaurantsError(error));
  }
}

/** GET /restaurants/public/:id */
export async function fetchRestaurantDetail(restaurantId: number | string): Promise<Restaurant> {
  const raw = await restaurantGet<unknown>(`/restaurants/public/${restaurantId}`);
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  return normalizeRestaurant(data);
}

/** GET /api/restaurants/:id/menu/online (preferred) with fallback to /menu */
export async function fetchRestaurantMenu(restaurantId: number | string): Promise<MenuCategory[]> {
  try {
    const raw = await restaurantGet<unknown>(`/api/restaurants/${restaurantId}/menu/online`);
    const data = unwrapApiResponse<unknown>(raw);
    return normalizeRestaurantMenu(data);
  } catch {
    // Fallback to standard menu endpoint
    const raw = await restaurantGet<unknown>(`/api/restaurants/${restaurantId}/menu`);
    const data = unwrapApiResponse<unknown>(raw);
    return normalizeRestaurantMenu(data);
  }
}

/**
 * Resolve a restaurant by slug or numeric ID.
 */
export async function resolveRestaurantIdentifier(identifier: string): Promise<Restaurant | null> {
  try {
    const raw = await restaurantGet<unknown>(
      `/customer-web/restaurants/resolve/${encodeURIComponent(identifier)}`
    );
    const data = unwrapApiResponse<Record<string, unknown>>(raw);
    return normalizeRestaurant(data);
  } catch {
    // Keep older fallbacks so existing personal links continue to work while APIs roll out.
  }

  // If numeric, fetch directly by ID
  if (/^\d+$/.test(identifier)) {
    try {
      return await fetchRestaurantDetail(identifier);
    } catch {
      return null;
    }
  }

  // Slug-based: try to find among nearby restaurants (best-effort fallback)
  try {
    // Try fetching without location to get any restaurants
    const raw = await restaurantGet<unknown>(`/api/restaurants?page=1&limit=100`);
    const data = unwrapApiResponse<unknown>(raw);
    const arr = Array.isArray(data) ? data : (data as Record<string, unknown>).restaurants ?? (data as Record<string, unknown>).items ?? [];
    const restaurants = (arr as Record<string, unknown>[]).map(normalizeRestaurant);

    const match = restaurants.find(r => {
      const slug = r.slug ?? slugify(r.name);
      return slug === identifier;
    });

    if (match) return match;

    // Last resort: try treating slug as ID (some URLs might use restaurant ID directly)
    return null;
  } catch {
    return null;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toNearbyRestaurantsError(error: unknown): string {
  const message = getErrorMessage(error);
  if (!message) return 'Could not load nearby restaurants.';
  if (message.length > 180) return 'Could not load nearby restaurants.';
  if (/^request failed with status 5\d\d/i.test(message)) {
    return 'Nearby restaurants are taking longer than expected. Please try again.';
  }
  return message;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }
  return '';
}
