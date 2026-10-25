import { mapsCapabilities } from './mapsCapabilities.mjs';

// Next.js public variables are intentionally direct references for build-time
// replacement. No server credential is referenced by this module.
export const webMapsConfig = Object.freeze({
  enabled: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ENABLED === 'true',
  keyConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()),
  pickerEnabled: process.env.NEXT_PUBLIC_CUSTOMER_MAP_PICKER_ENABLED === 'true',
  placesEnabled: process.env.NEXT_PUBLIC_GOOGLE_PLACES_ENABLED === 'true',
  geocodingEnabled: process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_ENABLED === 'true',
  browserKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '',
});

export const webMapsCapabilities = mapsCapabilities(webMapsConfig);

export interface MapCoordinate { latitude: number; longitude: number }
export interface PlaceSuggestion { id: string; label: string }
export interface AddressSearchProvider {
  search(query: string, sessionToken: string, signal?: AbortSignal): Promise<PlaceSuggestion[]>;
  details(id: string, sessionToken: string, signal?: AbortSignal): Promise<{ coordinate: MapCoordinate; address: string }>;
}
export interface AddressGeocodingProvider {
  reverse(coordinate: MapCoordinate, signal?: AbortSignal): Promise<string | null>;
}
