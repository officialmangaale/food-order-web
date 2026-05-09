export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  sort_order?: number;
  display_order?: number;
  is_active?: boolean;
  category_type?: string;
  items?: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  display_price?: string;
  image_url?: string;
  category_id?: number;
  category_name?: string;
  restaurant_id?: number;
  is_available?: boolean;
  is_veg?: boolean;
  is_vegetarian?: boolean;
  is_bestseller?: boolean;
  is_recommended?: boolean;
  is_popular?: boolean;
  is_taxable?: boolean;
  sort_order?: number;
  display_order?: number;
  food_type?: string;
  cuisine_type?: string;
  spicy_level?: string;
  preparation_time?: number;
  rating?: number;
  rating_count?: number;
  review_count?: number;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
  has_variants?: boolean;
  has_addons?: boolean;
}

export interface MenuVariant {
  id: number;
  name: string;
  price: number;
  is_available?: boolean;
  sort_order?: number;
}

export interface MenuAddon {
  id: number;
  name: string;
  price: number;
  is_available?: boolean;
  max_quantity?: number;
  sort_order?: number;
}

export interface MenuResponse {
  categories?: MenuCategory[];
  items?: MenuItem[];
}
