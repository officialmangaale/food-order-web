import type { MenuCategory, MenuItem } from '@/types/menu';

export interface RestaurantCategoryNavItem {
  key: string;
  name: string;
  count?: number;
  categoryType?: string;
}

export interface RestaurantMenuSectionData {
  key: string;
  title: string;
  category?: MenuCategory;
  items: MenuItem[];
  categoryType?: string;
}

export interface RestaurantMenuFilters {
  vegOnly: boolean;
  bestsellers: boolean;
  ratingFourPlus: boolean;
}
