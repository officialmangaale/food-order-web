export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: number;
  category_name?: string;
  restaurant_id?: number;
  is_available?: boolean;
  is_veg?: boolean;
  is_bestseller?: boolean;
  sort_order?: number;
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
