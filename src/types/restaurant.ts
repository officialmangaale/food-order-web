export interface Restaurant {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  cover_image_url?: string;
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
  delivery_radius_km?: number;
  estimated_delivery_time?: string;
  min_order_amount?: number;
  average_rating?: number;
  total_ratings?: number;
  cuisine_types?: string[];
  opening_hours?: string;
  closing_hours?: string;
  distance_km?: number;
  created_at?: string;
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
