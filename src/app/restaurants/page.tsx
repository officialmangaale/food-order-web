import { RestaurantsPageClient } from './RestaurantsPageClient';

interface RestaurantsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RestaurantsPage({ searchParams }: RestaurantsPageProps) {
  const query = await searchParams;

  return (
    <RestaurantsPageClient
      initialLat={readQueryNumber(query.lat)}
      initialLng={readQueryNumber(query.lng)}
      initialRadiusKm={readQueryNumber(query.radius_km)}
    />
  );
}

function readQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readQueryNumber(value: string | string[] | undefined) {
  const raw = readQueryValue(value);
  if (!raw) return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
