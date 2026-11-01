import { restaurantGet, restaurantPost } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { TrackCampaignClickPayload } from '@/types/marketing';

/** POST /customer-web/marketing/click */
export async function trackCampaignClick(payload: TrackCampaignClickPayload): Promise<void> {
  await restaurantPost('/customer-web/marketing/click', payload);
}

interface WhatsAppPricing {
  restaurant_id: number;
  delivery_rate_per_km: number;
  max_delivery_distance_km?: number;
}

export async function fetchWhatsAppPricing(restaurantId: number): Promise<WhatsAppPricing> {
  const raw = await restaurantGet<unknown>(`/customer-web/restaurants/${restaurantId}/whatsapp-pricing`);
  return unwrapApiResponse<WhatsAppPricing>(raw);
}
