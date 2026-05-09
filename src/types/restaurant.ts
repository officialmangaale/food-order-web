export interface Restaurant {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  cover_image_url?: string;
  background_url?: string;
  background_image_url?: string;
  image_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  is_open?: boolean;
  is_accepting_orders?: boolean;
  delivery_available?: boolean;
  supports_delivery?: boolean;
  delivery_radius_km?: number;
  estimated_delivery_time?: string;
  delivery_time?: string;
  min_order_amount?: number;
  average_rating?: number;
  rating?: number;
  total_ratings?: number;
  review_count?: number;
  cuisine_types?: string[];
  cuisine?: string;
  category?: string;
  type?: string;
  tags?: string[];
  status?: string;
  offer_badge?: string;
  opening_hours?: string;
  closing_hours?: string;
  distance_km?: number;
  distance?: string;
  created_at?: string;
}

export interface RestaurantCardData {
  id: number;
  name: string;
  slug?: string;
  category?: string;
  cuisine?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  distance?: string;
  distanceKm?: number;
  imageUrl?: string;
  backgroundImageUrl?: string;
  tags?: string[];
  address?: string;
  offerBadge?: string;
  isOpen?: boolean;
  supportsDelivery?: boolean;
}

export interface NearbyRestaurantsMeta {
  total?: number;
  page: number;
  limit: number;
  hasMore: boolean;
  radiusKm: number;
}

export interface NearbyRestaurantsResult {
  restaurants: RestaurantCardData[];
  meta: NearbyRestaurantsMeta;
}

export interface Offer {
  id: number;
  restaurant_id?: number;
  restaurant_name?: string;
  title: string;
  description?: string;
  image_url?: string;
  discount_type?: string;
  discount_value?: number;
  min_order_amount?: number;
  code?: string;
  is_active?: boolean;
  valid_from?: string;
  valid_until?: string;
}

export interface HomeFeedResponse {
  offers?: Offer[];
  categories?: HomeFeedCategory[];
  restaurants?: Restaurant[];
  featured_items?: FeaturedItem[];
}

export interface HomeFeedCategory {
  id: number;
  name: string;
  image_url?: string;
  icon?: string;
  item_count?: number;
}

export interface FeaturedItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  restaurant_id: number;
  restaurant_name?: string;
  category_id?: number;
  category_name?: string;
  is_veg?: boolean;
}
