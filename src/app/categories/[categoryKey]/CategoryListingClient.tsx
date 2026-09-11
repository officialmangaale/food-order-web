'use client';

import { CategoryBrowser } from '@/components/category/CategoryBrowser';
import { useLocationStore } from '@/store/locationStore';

interface Props {
  categoryKey: string;
  initialName?: string;
  initialLat?: number;
  initialLng?: number;
  initialRadiusKm?: number;
}

export function CategoryListingClient(props: Props) {
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);
  const lat = props.initialLat ?? latitude;
  const lng = props.initialLng ?? longitude;
  const categoryKey = props.categoryKey.trim().toLowerCase() || 'all';
  const radiusKm = props.initialRadiusKm ?? 7;
  // Reset pagination before requesting anything for a changed location or route.
  return <CategoryBrowser key={`${categoryKey}:${lat}:${lng}:${radiusKm}`}
    categoryKey={categoryKey} initialName={props.initialName} lat={lat} lng={lng} radiusKm={radiusKm} />;
}
