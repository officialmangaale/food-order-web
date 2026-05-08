import type { MenuItem } from './menu';
import type { Restaurant } from './restaurant';

export type SearchTab = 'dishes' | 'restaurants';

export type SearchPriceRange = 'under_100' | '100_250' | '250_500' | '500_plus';

export interface SearchFilters {
  ratingMin?: number;
  priceRange?: SearchPriceRange;
  deliveryTimeMax?: number;
  vegOnly?: boolean;
}

export interface SearchDishResult extends MenuItem {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug?: string;
  restaurant_logo_url?: string;
  rating?: number;
  rating_count?: number;
  delivery_time?: string;
}

export interface SearchRestaurantResult extends Restaurant {
  delivery_time?: string;
}

export interface SearchResultsResponse {
  query: string;
  dishes: SearchDishResult[];
  restaurants: SearchRestaurantResult[];
  total_dishes?: number;
  total_restaurants?: number;
  page?: number;
  limit?: number;
}

export interface SearchRequestParams {
  query: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  tab?: SearchTab | 'all';
  page?: number;
  limit?: number;
  filters?: SearchFilters;
}

export interface LockedSearchRequestParams {
  restaurantId: number | string;
  query: string;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
}
