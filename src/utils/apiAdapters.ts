import type { Restaurant } from '@/types/restaurant';
import type { MenuCategory, MenuItem, MenuVariant, MenuAddon } from '@/types/menu';

/**
 * Unwrap backend API response — handles both:
 *   { status, data: { ... } }  and  { ... } (flat)
 */
export function unwrapApiResponse<T>(response: unknown): T {
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>;
    // Standard wrapped response
    if ('data' in r && r.data !== undefined) {
      return r.data as T;
    }
  }
  return response as T;
}

/** Normalize restaurant from any backend shape */
export function normalizeRestaurant(raw: Record<string, unknown>): Restaurant {
  return {
    id: (raw.id ?? raw.ID ?? raw.restaurant_id ?? 0) as number,
    name: (raw.name ?? raw.restaurant_name ?? '') as string,
    slug: (raw.slug ?? raw.url_slug) as string | undefined,
    description: raw.description as string | undefined,
    logo_url: (raw.logo_url ?? raw.logo ?? raw.image_url) as string | undefined,
    banner_url: (raw.banner_url ?? raw.cover_image ?? raw.banner_image) as string | undefined,
    cover_image_url: raw.cover_image_url as string | undefined,
    phone: (raw.phone ?? raw.phone_number ?? raw.contact_phone) as string | undefined,
    email: raw.email as string | undefined,
    address: (raw.address ?? raw.full_address) as string | undefined,
    city: raw.city as string | undefined,
    area: raw.area as string | undefined,
    latitude: (raw.latitude ?? raw.lat) as number | undefined,
    longitude: (raw.longitude ?? raw.lng ?? raw.lon) as number | undefined,
    is_active: (raw.is_active ?? raw.active ?? true) as boolean,
    is_open: (raw.is_open ?? raw.open) as boolean | undefined,
    is_accepting_orders: (raw.is_accepting_orders ?? raw.accepting_orders) as boolean | undefined,
    delivery_available: (raw.delivery_available ?? raw.has_delivery ?? true) as boolean,
    delivery_radius_km: raw.delivery_radius_km as number | undefined,
    estimated_delivery_time: (raw.estimated_delivery_time ?? raw.delivery_time) as string | undefined,
    min_order_amount: raw.min_order_amount as number | undefined,
    average_rating: (raw.average_rating ?? raw.rating) as number | undefined,
    total_ratings: (raw.total_ratings ?? raw.rating_count) as number | undefined,
    cuisine_types: (raw.cuisine_types ?? raw.cuisines) as string[] | undefined,
    opening_hours: raw.opening_hours as string | undefined,
    closing_hours: raw.closing_hours as string | undefined,
    distance_km: (raw.distance_km ?? raw.distance) as number | undefined,
    created_at: raw.created_at as string | undefined,
  };
}

/** Normalize a menu response into categories with items */
export function normalizeMenu(raw: unknown): MenuCategory[] {
  if (!raw) return [];

  // If array of categories
  if (Array.isArray(raw)) {
    return raw.map(normalizeCategoryRaw);
  }

  const obj = raw as Record<string, unknown>;

  // { categories: [...] }
  if (Array.isArray(obj.categories)) {
    return (obj.categories as Record<string, unknown>[]).map(normalizeCategoryRaw);
  }

  // { menu: { categories: [...] } }
  if (obj.menu && typeof obj.menu === 'object') {
    const menu = obj.menu as Record<string, unknown>;
    if (Array.isArray(menu.categories)) {
      return (menu.categories as Record<string, unknown>[]).map(normalizeCategoryRaw);
    }
  }

  return [];
}

function normalizeCategoryRaw(raw: Record<string, unknown>): MenuCategory {
  return {
    id: (raw.id ?? raw.ID ?? raw.category_id ?? 0) as number,
    name: (raw.name ?? raw.category_name ?? '') as string,
    description: raw.description as string | undefined,
    sort_order: raw.sort_order as number | undefined,
    is_active: (raw.is_active ?? true) as boolean,
    items: Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[]).map(normalizeMenuItemRaw)
      : undefined,
  };
}

export function normalizeMenuItem(raw: Record<string, unknown>): MenuItem {
  return normalizeMenuItemRaw(raw);
}

function normalizeMenuItemRaw(raw: Record<string, unknown>): MenuItem {
  const variants = Array.isArray(raw.variants)
    ? (raw.variants as Record<string, unknown>[]).map(normalizeVariantRaw)
    : undefined;
  const addons = Array.isArray(raw.addons)
    ? (raw.addons as Record<string, unknown>[]).map(normalizeAddonRaw)
    : Array.isArray(raw.addon_groups)
      ? flattenAddonGroups(raw.addon_groups as Record<string, unknown>[])
      : undefined;

  return {
    id: (raw.id ?? raw.ID ?? raw.item_id ?? 0) as number,
    name: (raw.name ?? raw.item_name ?? '') as string,
    description: raw.description as string | undefined,
    price: (raw.price ?? raw.base_price ?? 0) as number,
    image_url: (raw.image_url ?? raw.image ?? raw.photo_url) as string | undefined,
    category_id: (raw.category_id ?? raw.cat_id) as number | undefined,
    category_name: raw.category_name as string | undefined,
    restaurant_id: raw.restaurant_id as number | undefined,
    is_available: (raw.is_available ?? raw.available ?? true) as boolean,
    is_veg: (raw.is_veg ?? raw.veg) as boolean | undefined,
    is_bestseller: (raw.is_bestseller ?? raw.bestseller) as boolean | undefined,
    sort_order: raw.sort_order as number | undefined,
    variants,
    addons,
    has_variants: variants ? variants.length > 0 : false,
    has_addons: addons ? addons.length > 0 : false,
  };
}

function normalizeVariantRaw(raw: Record<string, unknown>): MenuVariant {
  return {
    id: (raw.id ?? raw.variant_id ?? 0) as number,
    name: (raw.name ?? raw.variant_name ?? '') as string,
    price: (raw.price ?? 0) as number,
    is_available: (raw.is_available ?? true) as boolean,
    sort_order: raw.sort_order as number | undefined,
  };
}

function normalizeAddonRaw(raw: Record<string, unknown>): MenuAddon {
  return {
    id: (raw.id ?? raw.addon_id ?? 0) as number,
    name: (raw.name ?? raw.addon_name ?? '') as string,
    price: (raw.price ?? 0) as number,
    is_available: (raw.is_available ?? true) as boolean,
    max_quantity: raw.max_quantity as number | undefined,
    sort_order: raw.sort_order as number | undefined,
  };
}

/** Flatten addon groups into a flat addon list */
function flattenAddonGroups(groups: Record<string, unknown>[]): MenuAddon[] {
  const result: MenuAddon[] = [];
  for (const group of groups) {
    if (Array.isArray(group.addons)) {
      for (const addon of group.addons as Record<string, unknown>[]) {
        result.push(normalizeAddonRaw(addon));
      }
    }
  }
  return result;
}
