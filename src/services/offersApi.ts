import { getErrorMessage, restaurantGet } from './http';
import { normalizeHomeMenuOffersResponse } from '@/utils/offerAdapter';
import type { HomeMenuOffer, HomeMenuOffersRequest } from '@/types/offer';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_LIMIT = 10;
const HOME_MENU_OFFERS_PATH = '/customer-web/home/menu-offers';

export async function getHomeMenuOffers({
  lat,
  lng,
  radiusKm = DEFAULT_RADIUS_KM,
  limit = DEFAULT_LIMIT,
}: HomeMenuOffersRequest = {}): Promise<HomeMenuOffer[]> {
  try {
    const raw = await restaurantGet<unknown>(buildHomeMenuOffersPath({ lat, lng, radiusKm, limit }));
    return normalizeHomeMenuOffersResponse(raw);
  } catch (error) {
    throw normalizeOffersError(error);
  }
}

export const fetchHomeOffers = getHomeMenuOffers;

function buildHomeMenuOffersPath({
  lat,
  lng,
  radiusKm,
  limit,
}: {
  lat?: number;
  lng?: number;
  radiusKm: number;
  limit: number;
}) {
  const params = new URLSearchParams();
  const hasCoordinates = isValidNumber(lat) && isValidNumber(lng);

  if (hasCoordinates) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }

  params.set('radius_km', String(radiusKm));
  params.set('limit', String(limit));

  return `${HOME_MENU_OFFERS_PATH}?${params.toString()}`;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeOffersError(error: unknown) {
  if (error instanceof Error) return error;

  const normalized = new Error(getErrorMessage(error));
  if (error && typeof error === 'object' && 'status' in error) {
    Object.assign(normalized, { status: (error as { status: unknown }).status });
  }

  return normalized;
}
