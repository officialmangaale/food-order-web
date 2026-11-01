// A saved delivery address must use its own pin. The browsing location may
// belong to a different city and must never replace a missing address pin.
export function resolveCheckoutLocation(address, browsingLocation) {
  const candidate = address != null ? address : browsingLocation;
  const latitude = candidate?.latitude;
  const longitude = candidate?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
      (latitude === 0 && longitude === 0)) return undefined;
  return { latitude, longitude };
}
