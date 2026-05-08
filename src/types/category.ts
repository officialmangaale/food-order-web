import type { MenuAddon, MenuVariant } from './menu';

export interface HomeCategory {
  key: string;
  name: string;
  icon?: string | null;
  imageUrl?: string | null;
  categoryType?: string;
  itemCount?: number;
  restaurantCount?: number;
  representativeCategoryIds?: number[];
  isActive: boolean;
}

export interface CategoryFoodItem {
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
  displayPrice?: string;
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
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

export interface CategoryItemsCategory {
  key: string;
  name: string;
  categoryType?: string;
}

export interface CategoryItemsPagination {
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CategoryItemsFilters {
  radiusKm?: number;
  vegOnly?: boolean;
  sort?: string;
}

export interface CategoryItemsResult {
  category?: CategoryItemsCategory;
  items: CategoryFoodItem[];
  pagination: CategoryItemsPagination;
  filters?: CategoryItemsFilters;
  warnings?: string[];
}
