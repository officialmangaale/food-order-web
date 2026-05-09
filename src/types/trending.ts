import type { MenuAddon, MenuVariant } from './menu';

export interface TrendingItem {
  itemId: number;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  restaurantLogo?: string;
  distanceKm?: number;
  deliveryTime?: string;
  restaurantIsOpen?: boolean;
  categoryId?: number;
  categoryName?: string;
  name: string;
  description?: string;
  price: number;
  displayPrice: string;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  foodType?: string;
  cuisineType?: string;
  spicyLevel?: string;
  preparationTime?: number;
  isTaxable?: boolean;
  hasVariants?: boolean;
  hasAddons?: boolean;
  rating?: number;
  ratingCount?: number;
  badge: string;
  source?: string;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

export interface TrendingMeta {
  radiusKm?: number;
  windowDays?: number;
  source?: string;
  total?: number;
  hasMore?: boolean;
}

export interface TrendingItemResult {
  items: TrendingItem[];
  meta: TrendingMeta;
  warnings: string[];
}
