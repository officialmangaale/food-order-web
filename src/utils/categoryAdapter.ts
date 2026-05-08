import { formatMoney } from '@/utils/money';
import { normalizeImageUrl } from '@/utils/imageUrl';
import type {
  CategoryFoodItem,
  CategoryItemsCategory,
  CategoryItemsFilters,
  CategoryItemsPagination,
  CategoryItemsResult,
  HomeCategory,
} from '@/types/category';
import type { MenuAddon, MenuCategory, MenuItem, MenuVariant } from '@/types/menu';

export interface LockedRestaurantCategorySource {
  id: number;
  name: string;
  slug?: string;
  logoUrl?: string;
  deliveryTime?: string;
  distanceKm?: number;
  isOpen?: boolean;
}

export function normalizeCategory(raw: unknown): HomeCategory | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const rawKey = readString(obj.key);
  const rawName = readString(obj.name);
  const key = normalizeKey(rawKey || slugify(rawName ?? ''));
  if (!key) return null;

  const name = rawName || titleCase(key);

  return {
    key,
    name,
    icon: readString(obj.icon) ?? null,
    imageUrl: normalizeImageUrl(obj.image_url ?? obj.imageUrl) ?? null,
    categoryType: readString(obj.category_type ?? obj.categoryType),
    itemCount: readNumber(obj.item_count ?? obj.itemCount),
    restaurantCount: readNumber(obj.restaurant_count ?? obj.restaurantCount),
    representativeCategoryIds: readNumberArray(
      obj.representative_category_ids ?? obj.representativeCategoryIds
    ),
    isActive: obj.is_active !== false && obj.isActive !== false,
  };
}

export function normalizeCategories(rawCategories: unknown): HomeCategory[] {
  if (!Array.isArray(rawCategories)) return [];

  const unique = new Map<string, HomeCategory>();
  for (const raw of rawCategories) {
    const category = normalizeCategory(raw);
    if (!category?.isActive) continue;

    const existing = unique.get(category.key);
    if (!existing) {
      unique.set(category.key, category);
      continue;
    }

    unique.set(category.key, {
      ...existing,
      itemCount: maxNumber(existing.itemCount, category.itemCount),
      restaurantCount: maxNumber(existing.restaurantCount, category.restaurantCount),
      representativeCategoryIds: mergeNumbers(
        existing.representativeCategoryIds,
        category.representativeCategoryIds
      ),
      imageUrl: existing.imageUrl ?? category.imageUrl,
      icon: existing.icon ?? category.icon,
    });
  }

  const categories = Array.from(unique.values());
  if (categories.length === 0) return [];

  const allCategory =
    categories.find((category) => category.key === 'all') ??
    ({
      key: 'all',
      name: 'All',
      icon: null,
      imageUrl: null,
      categoryType: 'all',
      itemCount: sumNumbers(categories.map((category) => category.itemCount)),
      restaurantCount: undefined,
      representativeCategoryIds: [],
      isActive: true,
    } satisfies HomeCategory);

  return [
    allCategory,
    ...categories.filter((category) => category.key !== 'all'),
  ];
}

export function normalizeCategoryItem(raw: unknown): CategoryFoodItem | null {
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
    variants,
    addons,
  };
}

export function normalizeCategoryItems(rawItems: unknown): CategoryFoodItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((raw) => normalizeCategoryItem(raw))
    .filter((item): item is CategoryFoodItem => Boolean(item));
}

export function normalizeCategoryItemsResult(raw: unknown): CategoryItemsResult {
  const payload = extractDataPayload(raw);
  const obj = asRecord(payload);
  const itemsRaw = Array.isArray(payload)
    ? payload
    : obj
      ? obj.items ?? obj.menu_items ?? obj.results
      : [];

  return {
    category: normalizeCategoryInfo(obj?.category),
    items: normalizeCategoryItems(itemsRaw),
    pagination: normalizePagination(obj?.pagination),
    filters: normalizeFilters(obj?.filters),
    warnings: normalizeWarnings(obj?.warnings),
  };
}

export function categoryItemToMenuItem(item: CategoryFoodItem): MenuItem {
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

export function buildLockedCategories(menu: MenuCategory[] | undefined): HomeCategory[] {
  const activeCategories = (menu ?? []).filter((category) => category.is_active !== false);
  if (activeCategories.length === 0) return [];

  const categories = activeCategories.map((category) => ({
    key: String(category.id),
    name: category.name,
    icon: null,
    imageUrl: normalizeImageUrl(category.items?.find((item) => item.image_url)?.image_url) ?? null,
    categoryType: 'locked',
    itemCount: (category.items ?? []).filter((item) => item.is_available !== false).length,
    restaurantCount: 1,
    representativeCategoryIds: [category.id],
    isActive: true,
  }));

  return [
    {
      key: 'all',
      name: 'All',
      icon: null,
      imageUrl: null,
      categoryType: 'all',
      itemCount: sumNumbers(categories.map((category) => category.itemCount)),
      restaurantCount: 1,
      representativeCategoryIds: activeCategories.map((category) => category.id),
      isActive: true,
    },
    ...categories,
  ];
}

export function buildLockedCategoryItemsResult({
  selectedCategoryKey,
  menu,
  restaurant,
}: {
  selectedCategoryKey?: string | null;
  menu?: MenuCategory[];
  restaurant: LockedRestaurantCategorySource;
}): CategoryItemsResult {
  const selectedKey = selectedCategoryKey || 'all';
  const activeCategories = (menu ?? []).filter((category) => category.is_active !== false);
  const categories =
    selectedKey === 'all'
      ? activeCategories
      : activeCategories.filter((category) => String(category.id) === selectedKey);

  const items = categories.flatMap((category) =>
    (category.items ?? [])
      .filter((item) => item.is_available !== false)
      .map((item) => lockedMenuItemToCategoryFoodItem(item, category, restaurant))
  );

  const selectedCategory = buildLockedCategories(menu).find((category) => category.key === selectedKey);

  return {
    category: selectedCategory
      ? {
          key: selectedCategory.key,
          name: selectedCategory.name,
          categoryType: selectedCategory.categoryType,
        }
      : undefined,
    items,
    pagination: {
      page: 1,
      limit: items.length,
      hasMore: false,
    },
    filters: {
      radiusKm: undefined,
      vegOnly: false,
      sort: 'restaurant',
    },
    warnings: [],
  };
}

function lockedMenuItemToCategoryFoodItem(
  item: MenuItem,
  category: MenuCategory,
  restaurant: LockedRestaurantCategorySource
): CategoryFoodItem {
  return {
    itemId: item.id,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantSlug: restaurant.slug,
    restaurantLogo: restaurant.logoUrl,
    distanceKm: restaurant.distanceKm,
    deliveryTime: restaurant.deliveryTime,
    restaurantIsOpen: restaurant.isOpen,
    categoryId: category.id,
    categoryName: category.name,
    name: item.name,
    description: item.description,
    price: item.price,
    displayPrice: formatMoney(item.price),
    imageUrl: normalizeImageUrl(item.image_url),
    isAvailable: item.is_available !== false,
    isVegetarian: item.is_veg,
    isTaxable: item.is_taxable,
    hasVariants: item.has_variants ?? ((item.variants?.length ?? 0) > 0),
    hasAddons: item.has_addons ?? ((item.addons?.length ?? 0) > 0),
    variants: item.variants ?? [],
    addons: item.addons ?? [],
  };
}

export function extractCategoriesPayload(raw: unknown): unknown[] {
  const payload = extractDataPayload(raw);
  if (Array.isArray(payload)) return payload;

  const obj = asRecord(payload);
  if (Array.isArray(obj?.categories)) return obj.categories;
  if (Array.isArray(obj?.items)) return obj.items;

  return [];
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

function normalizeCategoryInfo(raw: unknown): CategoryItemsCategory | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;

  const key = normalizeKey(readString(obj.key) || slugify(readString(obj.name) ?? ''));
  const name = readString(obj.name) || titleCase(key);
  if (!key || !name) return undefined;

  return {
    key,
    name,
    categoryType: readString(obj.category_type ?? obj.categoryType),
  };
}

function normalizePagination(raw: unknown): CategoryItemsPagination {
  const obj = asRecord(raw);

  return {
    page: readNumber(obj?.page) ?? 1,
    limit: readNumber(obj?.limit) ?? 20,
    hasMore: readBoolean(obj?.has_more ?? obj?.hasMore) ?? false,
  };
}

function normalizeFilters(raw: unknown): CategoryItemsFilters | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;

  return {
    radiusKm: readNumber(obj.radius_km ?? obj.radiusKm),
    vegOnly: readBoolean(obj.veg_only ?? obj.vegOnly),
    sort: readString(obj.sort),
  };
}

function normalizeWarnings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((warning) => String(warning)).filter(Boolean);
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
  const addonValues = Array.isArray(raw) ? raw : [];
  const addons: MenuAddon[] = [];

  for (const value of addonValues) {
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

function readNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const numbers = value
    .map((item) => readNumber(item))
    .filter((item): item is number => item != null);
  return numbers.length > 0 ? numbers : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeKey(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function maxNumber(a?: number, b?: number) {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

function mergeNumbers(a?: number[], b?: number[]) {
  const merged = Array.from(new Set([...(a ?? []), ...(b ?? [])]));
  return merged.length > 0 ? merged : undefined;
}

function sumNumbers(values: Array<number | undefined>) {
  const validValues = values.filter((value): value is number => value != null);
  if (validValues.length === 0) return undefined;
  return validValues.reduce((sum, value) => sum + value, 0);
}
