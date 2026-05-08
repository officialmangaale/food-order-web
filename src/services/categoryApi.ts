import { restaurantGet } from './http';
import {
  extractCategoriesPayload,
  normalizeCategories,
  normalizeCategoryItemsResult,
} from '@/utils/categoryAdapter';
import type { CategoryItemsResult, HomeCategory } from '@/types/category';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_ITEMS_LIMIT = 20;

export async function getCustomerWebCategories(params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  includeAll?: boolean;
} = {}): Promise<HomeCategory[]> {
  const query = new URLSearchParams();
  appendCoordinates(query, params.lat, params.lng);
  query.set('radius_km', String(params.radiusKm ?? DEFAULT_RADIUS_KM));
  query.set('include_all', String(params.includeAll ?? true));

  try {
    const raw = await restaurantGet<unknown>(`/customer-web/categories?${query.toString()}`);
    return normalizeCategories(extractCategoriesPayload(raw));
  } catch (error) {
    throw new Error(toCustomerWebError(error, 'Could not load categories near you.'));
  }
}

export async function getCustomerWebCategoryItems(params: {
  categoryKey: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
  vegOnly?: boolean;
  sort?: string;
}): Promise<CategoryItemsResult> {
  const query = new URLSearchParams();
  appendCoordinates(query, params.lat, params.lng);
  query.set('radius_km', String(params.radiusKm ?? DEFAULT_RADIUS_KM));
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? DEFAULT_ITEMS_LIMIT));
  if (params.vegOnly != null) query.set('veg_only', String(params.vegOnly));
  if (params.sort) query.set('sort', params.sort);

  try {
    const raw = await restaurantGet<unknown>(
      `/customer-web/categories/${encodeURIComponent(params.categoryKey)}/items?${query.toString()}`
    );
    return normalizeCategoryItemsResult(raw);
  } catch (error) {
    throw new Error(toCustomerWebError(error, 'Could not load dishes for this category.'));
  }
}

function appendCoordinates(query: URLSearchParams, lat?: number, lng?: number) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  query.set('lat', String(lat));
  query.set('lng', String(lng));
}

function toCustomerWebError(error: unknown, fallback: string): string {
  const message = getErrorMessage(error);
  if (!message) return fallback;
  if (message.length > 180) return fallback;
  if (/^request failed with status 5\d\d/i.test(message)) {
    return 'The restaurant service is taking longer than expected. Please try again.';
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
