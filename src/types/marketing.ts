export interface CampaignContext {
  restaurantId: number;
  restaurantSlug?: string;
  couponCode?: string;
  campaignId?: number;
  utmSource?: string;
  utmCampaign?: string;
  sourceUrl?: string;
  capturedAt: number;
}

export interface TrackCampaignClickPayload {
  restaurant_id: number;
  campaign_id?: number;
  coupon_code?: string;
  source?: string;
  url?: string;
}
