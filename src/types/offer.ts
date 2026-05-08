export interface RawMenuOffer {
  offer_item_id?: number;
  item_id?: number;
  category_id?: number;
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant_slug?: string;
  title?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  display_price?: string;
  image_url?: string;
  fallback_image_url?: string;
  background_url?: string;
  badge_text?: string;
  cta_text?: string;
  cta_url?: string;
  category_name?: string;
  category_type?: string;
  is_available?: boolean;
  is_vegetarian?: boolean;
  food_type?: string;
  cuisine_type?: string;
  spicy_level?: string;
  distance_km?: number;
  delivery_time?: string;
  restaurant_is_open?: boolean;
  restaurant_supports_delivery?: boolean;
  schedule?: {
    schedule_supported?: boolean;
    type?: string;
    weekdays?: string[];
    is_active_now?: boolean;
    reason?: string;
  };
}

export interface HomeMenuOffer {
  id: string;
  offerItemId?: number;
  categoryId?: number;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  title: string;
  subtitle: string;
  description?: string;
  price?: number;
  displayPrice?: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
  badgeText: string;
  ctaText: string;
  ctaUrl: string;
  categoryName?: string;
  distanceKm?: number;
  deliveryTime?: string;
  isRestaurantOpen?: boolean;
  isAvailable?: boolean;
}

export interface HomeMenuOffersRequest {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

export type HomeOffer = HomeMenuOffer;
export type HomeOffersRequest = HomeMenuOffersRequest;
