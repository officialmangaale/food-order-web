'use client';

import { useQuery } from '@tanstack/react-query';
import { getHomeMenuOffers } from '@/services/offersApi';
import { useLocationStore } from '@/store/locationStore';
import { useRestaurantMode } from '@/hooks/useRestaurantMode';
import type { HomeMenuOffer } from '@/types/offer';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_LIMIT = 10;

interface UseHomeMenuOffersOptions {
  radiusKm?: number;
  limit?: number;
}

export function useHomeMenuOffers({
  radiusKm = DEFAULT_RADIUS_KM,
  limit = DEFAULT_LIMIT,
}: UseHomeMenuOffersOptions = {}) {
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);
  const locationLabel = useLocationStore((s) => s.label);
  const {
    isLockedRoute,
    lockedRestaurantId,
    lockedRestaurantName,
    lockedRestaurantSlug,
    homeLink,
  } = useRestaurantMode();

  const hasCoordinates = isValidNumber(lat) && isValidNumber(lng);
  const queryLat = hasCoordinates ? lat : undefined;
  const queryLng = hasCoordinates ? lng : undefined;
  const effectiveLockedRestaurantId = isLockedRoute ? lockedRestaurantId : null;
  const canShowGlobalOffers = !isLockedRoute;
  const enabled = canShowGlobalOffers || effectiveLockedRestaurantId != null;

  const query = useQuery({
    queryKey: ['home-menu-offers', queryLat, queryLng, radiusKm, effectiveLockedRestaurantId],
    queryFn: async () => {
      const locationOffers = await getHomeMenuOffers({
        lat: queryLat,
        lng: queryLng,
        radiusKm,
        limit,
      });
      const filteredLocationOffers = filterLockedOffers(locationOffers, effectiveLockedRestaurantId);

      if (filteredLocationOffers.length > 0 || !hasCoordinates) {
        return filteredLocationOffers;
      }

      const genericOffers = await getHomeMenuOffers({ radiusKm, limit });
      return filterLockedOffers(genericOffers, effectiveLockedRestaurantId);
    },
    enabled,
    staleTime: 60_000,
    retry: 1,
    placeholderData: canShowGlobalOffers ? (previousData) => previousData : undefined,
  });

  return {
    ...query,
    data: (query.data ?? []) as HomeMenuOffer[],
    hasCoordinates,
    locationLabel,
    isLockedRoute,
    lockedRestaurantId: effectiveLockedRestaurantId,
    lockedRestaurantName,
    lockedRestaurantSlug,
    lockedHomeLink: homeLink,
  };
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function filterLockedOffers(offers: HomeMenuOffer[], lockedRestaurantId: number | null) {
  if (lockedRestaurantId == null) return offers;
  return offers.filter((offer) => offer.restaurantId === lockedRestaurantId);
}
