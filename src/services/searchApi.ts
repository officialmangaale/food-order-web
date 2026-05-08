import { restaurantGet } from './http';
import { unwrapApiResponse, normalizeMenuItem, normalizeRestaurant } from '@/utils/apiAdapters';
import type {
  LockedSearchRequestParams,
  SearchDishResult,
  SearchRequestParams,
  SearchRestaurantResult,
  SearchResultsResponse,
} from '@/types/search';

export async function fetchGlobalSearch(params: SearchRequestParams): Promise<SearchResultsResponse> {
  const query = buildSearchParams(params);
  const raw = await restaurantGet<unknown>(`/customer-web/search?${query.toString()}`);
  return normalizeSearchResponse(unwrapApiResponse<unknown>(raw), params.query);
}

export async function fetchLockedRestaurantSearch(
  params: LockedSearchRequestParams
): Promise<SearchResultsResponse> {
  const query = buildSearchParams({
    query: params.query,
    page: params.page,
    limit: params.limit,
    filters: params.filters,
  });
  const raw = await restaurantGet<unknown>(
    `/customer-web/restaurants/${params.restaurantId}/search?${query.toString()}`
  );
  return normalizeSearchResponse(unwrapApiResponse<unknown>(raw), params.query, params.restaurantId);
}

function buildSearchParams(params: Omit<SearchRequestParams, 'radiusKm'> & { radiusKm?: number }) {
  const query = new URLSearchParams();
  query.set('q', params.query);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  if (params.lat != null) query.set('lat', String(params.lat));
  if (params.lng != null) query.set('lng', String(params.lng));
  if (params.radiusKm != null) query.set('radius_km', String(params.radiusKm));
  if (params.tab) query.set('tab', params.tab);

  const filters = params.filters;
  if (filters?.ratingMin) query.set('rating_min', String(filters.ratingMin));
  if (filters?.priceRange) query.set('price_range', filters.priceRange);
  if (filters?.deliveryTimeMax) {
    query.set('delivery_time_max', String(filters.deliveryTimeMax));
  }
  if (filters?.vegOnly) query.set('veg_only', 'true');

  return query;
}

function normalizeSearchResponse(
  raw: unknown,
  query: string,
  lockedRestaurantId?: number | string
): SearchResultsResponse {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const dishesRaw =
    pickArray(data, ['dishes', 'items', 'menu_items', 'results']) ??
    (Array.isArray(raw) ? raw : []);
  const restaurantsRaw = pickArray(data, ['restaurants', 'related_restaurants', 'restaurant_results']) ?? [];

  const dishes = (dishesRaw as Record<string, unknown>[])
    .map((item) => normalizeSearchDish(item, lockedRestaurantId))
    .filter((item) => item.id > 0 && item.name);

  const restaurants = (restaurantsRaw as Record<string, unknown>[])
    .map(normalizeSearchRestaurant)
    .filter((restaurant) => restaurant.id > 0 && restaurant.name);

  return {
    query,
    dishes,
    restaurants,
    total_dishes: asNumber(data.total_dishes ?? data.dishes_count ?? data.total_items),
    total_restaurants: asNumber(data.total_restaurants ?? data.restaurants_count),
    page: asNumber(data.page),
    limit: asNumber(data.limit),
  };
}

function normalizeSearchDish(
  raw: Record<string, unknown>,
  lockedRestaurantId?: number | string
): SearchDishResult {
  const restaurant =
    raw.restaurant && typeof raw.restaurant === 'object'
      ? (raw.restaurant as Record<string, unknown>)
      : undefined;
  const item = normalizeMenuItem(raw);
  const restaurantId =
    asNumber(raw.restaurant_id ?? restaurant?.id) ?? asNumber(lockedRestaurantId) ?? item.restaurant_id ?? 0;

  return {
    ...item,
    restaurant_id: restaurantId,
    restaurant_name: String(raw.restaurant_name ?? restaurant?.name ?? ''),
    restaurant_slug: (raw.restaurant_slug ?? restaurant?.slug) as string | undefined,
    restaurant_logo_url: (raw.restaurant_logo_url ?? restaurant?.logo_url) as string | undefined,
    rating: asNumber(raw.rating ?? raw.average_rating),
    rating_count: asNumber(raw.rating_count ?? raw.total_ratings),
    delivery_time: (raw.delivery_time ?? raw.estimated_delivery_time) as string | undefined,
  };
}

function normalizeSearchRestaurant(raw: Record<string, unknown>): SearchRestaurantResult {
  const restaurant = normalizeRestaurant(raw);

  return {
    ...restaurant,
    delivery_time: (raw.delivery_time ?? raw.estimated_delivery_time) as string | undefined,
  };
}

function pickArray(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[];
  }

  if (data.results && typeof data.results === 'object' && !Array.isArray(data.results)) {
    return pickArray(data.results as Record<string, unknown>, keys);
  }

  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
