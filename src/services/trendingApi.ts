import { restaurantGet } from './http';
import { normalizeTrendingItemsResult } from '@/utils/trendingAdapter';
import type { TrendingItemResult } from '@/types/trending';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_WINDOW_DAYS = 7;
const DEFAULT_LIMIT = 6;

export async function getTrendingItems(params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  windowDays?: number;
  limit?: number;
  vegOnly?: boolean;
} = {}): Promise<TrendingItemResult> {
  const query = new URLSearchParams();
  appendCoordinates(query, params.lat, params.lng);
  query.set('radius_km', String(params.radiusKm ?? DEFAULT_RADIUS_KM));
  query.set('window_days', String(params.windowDays ?? DEFAULT_WINDOW_DAYS));
  query.set('limit', String(params.limit ?? DEFAULT_LIMIT));
  if (params.vegOnly != null) query.set('veg_only', String(params.vegOnly));

  try {
    const raw = await restaurantGet<unknown>(`/customer-web/trending-items?${query.toString()}`);
    return normalizeTrendingItemsResult(raw);
  } catch (error) {
    throw new Error(toTrendingError(error));
  }
}

function appendCoordinates(query: URLSearchParams, lat?: number, lng?: number) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  query.set('lat', String(lat));
  query.set('lng', String(lng));
}

function toTrendingError(error: unknown): string {
  const message = getErrorMessage(error);
  if (!message) return 'Could not load trending dishes right now.';
  if (message.length > 180) return 'Could not load trending dishes right now.';
  if (/^request failed with status 5\d\d/i.test(message)) {
    return 'Trending dishes are taking longer than expected. Please try again.';
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
