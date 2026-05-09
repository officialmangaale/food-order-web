import { restaurantPost } from './http';
import type { TrackCampaignClickPayload } from '@/types/marketing';

/** POST /customer-web/marketing/click */
export async function trackCampaignClick(payload: TrackCampaignClickPayload): Promise<void> {
  await restaurantPost('/customer-web/marketing/click', payload);
}
