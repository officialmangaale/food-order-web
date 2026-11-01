interface LocationPin {
  latitude?: number | null;
  longitude?: number | null;
}
export function resolveCheckoutLocation(
  address?: LocationPin | null,
  browsingLocation?: LocationPin | null
): { latitude: number; longitude: number } | undefined;
