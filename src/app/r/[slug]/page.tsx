import { RestaurantDetailPage } from '@/components/restaurant/RestaurantDetailPage';

interface LockedRestaurantRoutePageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LockedRestaurantRoutePage({
  params,
  searchParams,
}: LockedRestaurantRoutePageProps) {
  const { slug } = await params;
  const campaignQuery = (await searchParams) ?? {};

  return <RestaurantDetailPage slug={slug} locked campaignQuery={campaignQuery} />;
}
