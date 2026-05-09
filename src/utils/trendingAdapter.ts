import { formatMoney } from '@/utils/money';
import { normalizeImageUrl } from '@/utils/imageUrl';
import type { MenuAddon, MenuItem, MenuVariant } from '@/types/menu';
import type { TrendingItem, TrendingItemResult, TrendingMeta } from '@/types/trending';

export function normalizeTrendingItemsResult(raw: unknown): TrendingItemResult {
  const payload = extractDataPayload(raw);
  const obj = asRecord(payload);
  const itemsRaw = Array.isArray(payload)
    ? payload
    : obj
      ? obj.items ?? obj.results ?? obj.menu_items
      : [];

  return {
    items: normalizeTrendingItems(itemsRaw),
    meta: normalizeTrendingMeta(obj?.meta, obj),
    warnings: normalizeWarnings(obj?.warnings),
  };
}

export function normalizeTrendingItems(rawItems: unknown): TrendingItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((raw) => normalizeTrendingItem(raw))
    .filter((item): item is TrendingItem => Boolean(item));
}

export function normalizeTrendingItem(raw: unknown): TrendingItem | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const itemId = readNumber(obj.item_id ?? obj.itemId ?? obj.id);
  const restaurantId = readNumber(obj.restaurant_id ?? obj.restaurantId);
  const name = readString(obj.name ?? obj.item_name);
  const restaurantName = readString(obj.restaurant_name ?? obj.restaurantName);

  if (!itemId || !restaurantId || !name || obj.is_available === false || obj.isAvailable === false) {
    return null;
  }

  const price = readNumber(obj.price ?? obj.base_price) ?? 0;
  const variants = normalizeVariants(obj.variants);
  const addons = normalizeAddons(obj.addons);
  const source = readString(obj.source);

  return {
    itemId,
    restaurantId,
    restaurantName: restaurantName || 'Mangaale partner',
    restaurantSlug: readString(obj.restaurant_slug ?? obj.restaurantSlug),
    restaurantLogo: normalizeImageUrl(obj.restaurant_logo ?? obj.restaurantLogo),
    distanceKm: readNumber(obj.distance_km ?? obj.distanceKm),
    deliveryTime: readString(obj.delivery_time ?? obj.deliveryTime),
    restaurantIsOpen: readBoolean(obj.restaurant_is_open ?? obj.restaurantIsOpen),
    categoryId: readNumber(obj.category_id ?? obj.categoryId),
    categoryName: readString(obj.category_name ?? obj.categoryName),
    name,
    description: readString(obj.description),
    price,
    displayPrice: readString(obj.display_price ?? obj.displayPrice) || formatMoney(price),
    imageUrl: normalizeImageUrl(obj.image_url ?? obj.imageUrl),
    isAvailable: true,
    isVegetarian: readBoolean(obj.is_vegetarian ?? obj.isVegetarian ?? obj.is_veg ?? obj.veg),
    foodType: readString(obj.food_type ?? obj.foodType),
    cuisineType: readString(obj.cuisine_type ?? obj.cuisineType),
    spicyLevel: readString(obj.spicy_level ?? obj.spicyLevel),
    preparationTime: readNumber(obj.preparation_time ?? obj.preparationTime),
    isTaxable: readBoolean(obj.is_taxable ?? obj.isTaxable),
    hasVariants: readBoolean(obj.has_variants ?? obj.hasVariants) ?? (variants.length > 0),
    hasAddons: readBoolean(obj.has_addons ?? obj.hasAddons) ?? (addons.length > 0),
    rating: readNumber(obj.rating),
    ratingCount: readNumber(obj.rating_count ?? obj.ratingCount),
    badge: readString(obj.trending_badge ?? obj.trendingBadge) || (source === 'fallback' ? 'POPULAR' : 'TRENDING'),
    source,
    variants,
    addons,
  };
}

export function trendingItemToMenuItem(item: TrendingItem): MenuItem {
  return {
    id: item.itemId,
    name: item.name,
    description: item.description,
    price: item.price,
    image_url: item.imageUrl,
    category_id: item.categoryId,
    category_name: item.categoryName,
    restaurant_id: item.restaurantId,
    is_available: item.isAvailable,
    is_veg: item.isVegetarian,
    variants: item.variants,
    addons: item.addons,
    has_variants: item.hasVariants,
    has_addons: item.hasAddons,
    is_taxable: item.isTaxable,
  };
}

function normalizeTrendingMeta(raw: unknown, root?: unknown): TrendingMeta {
  const obj = asRecord(raw);
  const rootObj = asRecord(root);

  return {
    radiusKm: readNumber(obj?.radius_km ?? obj?.radiusKm ?? rootObj?.radius_km ?? rootObj?.radiusKm),
    windowDays: readNumber(obj?.window_days ?? obj?.windowDays ?? rootObj?.window_days ?? rootObj?.windowDays),
    source: readString(obj?.source ?? rootObj?.source),
    total: readNumber(obj?.total ?? obj?.total_count ?? obj?.totalCount ?? rootObj?.total ?? rootObj?.total_count ?? rootObj?.totalCount),
    hasMore: readBoolean(obj?.has_more ?? obj?.hasMore ?? rootObj?.has_more ?? rootObj?.hasMore),
  };
}

function normalizeVariants(raw: unknown): MenuVariant[] {
  if (!Array.isArray(raw)) return [];

  const variants: MenuVariant[] = [];
  for (const value of raw) {
    const obj = asRecord(value);
    if (!obj) continue;

    const id = readNumber(obj.id ?? obj.variant_id);
    const name = readString(obj.name ?? obj.variant_name);
    if (!id || !name) continue;

    variants.push({
      id,
      name,
      price: readNumber(obj.price) ?? 0,
      is_available: readBoolean(obj.is_available ?? obj.isAvailable) ?? true,
      sort_order: readNumber(obj.sort_order ?? obj.sortOrder),
    });
  }
  return variants;
}

function normalizeAddons(raw: unknown): MenuAddon[] {
  if (!Array.isArray(raw)) return [];

  const addons: MenuAddon[] = [];
  for (const value of raw) {
    const obj = asRecord(value);
    if (!obj) continue;

    const id = readNumber(obj.id ?? obj.addon_id);
    const name = readString(obj.name ?? obj.addon_name);
    if (!id || !name) continue;

    addons.push({
      id,
      name,
      price: readNumber(obj.price) ?? 0,
      is_available: readBoolean(obj.is_available ?? obj.isAvailable) ?? true,
      max_quantity: readNumber(obj.max_quantity ?? obj.maxQuantity),
      sort_order: readNumber(obj.sort_order ?? obj.sortOrder),
    });
  }
  return addons;
}

function extractDataPayload(raw: unknown): unknown {
  const obj = asRecord(raw);
  if (!obj) return raw;

  const firstData = obj.data;
  const firstDataObj = asRecord(firstData);
  if (firstDataObj && 'data' in firstDataObj) return firstDataObj.data;
  if (firstData !== undefined) return firstData;

  return raw;
}

function normalizeWarnings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((warning) => String(warning)).filter(Boolean);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
