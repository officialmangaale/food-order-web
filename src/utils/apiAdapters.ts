import type { Restaurant } from '@/types/restaurant';
import type { MenuCategory, MenuItem, MenuVariant, MenuAddon } from '@/types/menu';
import { formatMoney } from '@/utils/money';
import { normalizeImageUrl } from '@/utils/imageUrl';

/**
 * Unwrap common backend response envelopes:
 * { data }, { data: { data } }, or a flat payload.
 */
export function unwrapApiResponse<T>(response: unknown): T {
  let current = response;

  for (let depth = 0; depth < 3; depth += 1) {
    const obj = asRecord(current);
    if (!obj || !('data' in obj) || obj.data === undefined) break;
    current = obj.data;
  }

  return current as T;
}

export function normalizeRestaurant(rawInput: unknown): Restaurant {
  const payload = unwrapApiResponse<unknown>(rawInput);
  const payloadObj = asRecord(payload);
  const raw =
    asRecord(payloadObj?.restaurant) ??
    asRecord(payloadObj?.result) ??
    asRecord(payload) ??
    {};

  const id = readNumber(raw.id ?? raw.ID ?? raw.restaurant_id ?? raw.restaurantId) ?? 0;
  const name = readString(raw.name ?? raw.restaurant_name ?? raw.restaurantName) ?? 'Restaurant';
  const distanceKm = readDistanceKm(raw.distance_km ?? raw.distanceKm, raw.distance);
  const deliveryTime = sanitizeDeliveryTime(
    readString(raw.estimated_delivery_time ?? raw.delivery_time ?? raw.deliveryTime),
    distanceKm
  );
  const rating = readNumber(raw.average_rating ?? raw.averageRating ?? raw.rating);
  const reviewCount = readNumber(
    raw.review_count ?? raw.reviewCount ?? raw.total_ratings ?? raw.totalRatings ?? raw.rating_count
  );
  const cuisineText = readString(raw.cuisine ?? raw.cuisine_type ?? raw.cuisineType);
  const category = readString(raw.category ?? raw.restaurant_category);
  const type = readString(raw.type ?? raw.restaurant_type);
  const cuisineTypes =
    readStringArray(raw.cuisine_types ?? raw.cuisineTypes ?? raw.cuisines) ??
    splitCuisineText(cuisineText);
  const tags = readStringArray(raw.tags);
  const deliveryAvailable = readBoolean(
    raw.supports_delivery ??
      raw.supportsDelivery ??
      raw.delivery_available ??
      raw.deliveryAvailable ??
      raw.has_delivery
  );
  const isActive = readBoolean(raw.is_active ?? raw.isActive ?? raw.active);
  const isOpen = readBoolean(raw.is_open ?? raw.isOpen ?? raw.open);
  const isAcceptingOrders = readBoolean(
    raw.is_accepting_orders ?? raw.isAcceptingOrders ?? raw.accepting_orders ?? raw.acceptingOrders
  );

  const backgroundImageUrl = normalizeImageUrl(
    raw.background_image_url ?? raw.backgroundImageUrl ?? raw.hero_image_url ?? raw.heroImageUrl
  );
  const backgroundUrl = normalizeImageUrl(raw.background_url ?? raw.backgroundUrl);
  const imageUrl = normalizeImageUrl(raw.image_url ?? raw.imageUrl ?? raw.photo_url ?? raw.photoUrl);
  const logoUrl = normalizeImageUrl(raw.logo_url ?? raw.logoUrl ?? raw.logo);
  const bannerUrl = normalizeImageUrl(
    raw.banner_url ?? raw.bannerUrl ?? raw.cover_image ?? raw.coverImage ?? raw.banner_image
  );
  const coverImageUrl = normalizeImageUrl(raw.cover_image_url ?? raw.coverImageUrl);

  return {
    id,
    name,
    slug: readString(raw.slug ?? raw.url_slug ?? raw.restaurant_slug ?? raw.restaurantSlug),
    description: readString(raw.description),
    logo_url: logoUrl,
    banner_url: bannerUrl,
    cover_image_url: coverImageUrl,
    background_url: backgroundUrl,
    background_image_url: backgroundImageUrl,
    image_url: imageUrl,
    phone: readString(raw.phone ?? raw.phone_number ?? raw.contact_phone),
    email: readString(raw.email),
    address: readString(raw.address ?? raw.full_address ?? raw.fullAddress),
    city: readString(raw.city),
    area: readString(raw.area ?? raw.locality),
    latitude: readNumber(raw.latitude ?? raw.lat),
    longitude: readNumber(raw.longitude ?? raw.lng ?? raw.lon),
    is_active: isActive ?? true,
    is_open: isOpen,
    is_accepting_orders: isAcceptingOrders,
    delivery_available: deliveryAvailable ?? true,
    supports_delivery: deliveryAvailable ?? true,
    delivery_radius_km: readNumber(raw.delivery_radius_km ?? raw.deliveryRadiusKm),
    estimated_delivery_time: deliveryTime,
    delivery_time: deliveryTime,
    min_order_amount: readNumber(raw.min_order_amount ?? raw.minOrderAmount),
    average_rating: rating,
    rating,
    total_ratings: reviewCount,
    review_count: reviewCount,
    cuisine_types: cuisineTypes,
    cuisine: cuisineText ?? cuisineTypes?.join(', '),
    category,
    type,
    tags,
    status: readString(raw.status),
    offer_badge: readOfferBadge(raw),
    opening_hours: readString(raw.opening_hours ?? raw.openingHours),
    closing_hours: readString(raw.closing_hours ?? raw.closingHours),
    distance_km: distanceKm,
    distance: readString(raw.distance),
    created_at: readString(raw.created_at ?? raw.createdAt),
  };
}

export function normalizeRestaurantMenu(rawInput: unknown): MenuCategory[] {
  const payload = unwrapApiResponse<unknown>(rawInput);

  if (Array.isArray(payload)) {
    return looksLikeFlatItems(payload)
      ? categoriesFromFlatItems(payload)
      : normalizeCategoriesWithFlatItems(payload, []);
  }

  const root = asRecord(payload);
  if (!root) return [];

  const menuObj = asRecord(root.menu) ?? root;
  const categoriesRaw =
    readArray(root.categories) ??
    readArray(root.menu_categories) ??
    readArray(root.category_list) ??
    readArray(menuObj.categories) ??
    readArray(menuObj.menu_categories) ??
    [];
  const flatItemsRaw =
    readArray(root.items) ??
    readArray(root.menu_items) ??
    readArray(root.menuItems) ??
    readArray(menuObj.items) ??
    readArray(menuObj.menu_items) ??
    readArray(menuObj.menuItems) ??
    [];

  if (categoriesRaw.length > 0) {
    return normalizeCategoriesWithFlatItems(categoriesRaw, flatItemsRaw);
  }

  return categoriesFromFlatItems(flatItemsRaw);
}

export const normalizeMenu = normalizeRestaurantMenu;

export function normalizeMenuCategory(rawInput: unknown): MenuCategory {
  const raw = asRecord(rawInput) ?? {};
  const itemsRaw = readArray(raw.items) ?? readArray(raw.menu_items) ?? [];
  const id = readNumber(raw.id ?? raw.ID ?? raw.category_id ?? raw.categoryId) ?? 0;
  const name = readString(raw.name ?? raw.category_name ?? raw.categoryName) ?? 'Menu';

  return {
    id,
    name,
    description: readString(raw.description),
    sort_order: readNumber(raw.sort_order ?? raw.sortOrder ?? raw.display_order ?? raw.displayOrder),
    display_order: readNumber(raw.display_order ?? raw.displayOrder ?? raw.sort_order ?? raw.sortOrder),
    is_active: readBoolean(raw.is_active ?? raw.isActive ?? raw.active) ?? true,
    category_type: readString(raw.category_type ?? raw.categoryType),
    items: itemsRaw.map((item) =>
      normalizeMenuItemWithFallback(item, {
        categoryId: id,
        categoryName: name,
      })
    ),
  };
}

export function normalizeMenuItem(rawInput: unknown): MenuItem {
  return normalizeMenuItemWithFallback(rawInput, {});
}

export function normalizeVariant(rawInput: unknown): MenuVariant {
  const raw = asRecord(rawInput) ?? {};
  const price = readPrice(raw.price ?? raw.base_price ?? raw.display_price) ?? 0;

  return {
    id: readNumber(raw.id ?? raw.ID ?? raw.variant_id ?? raw.variantId) ?? 0,
    name: readString(raw.name ?? raw.variant_name ?? raw.variantName) ?? 'Variant',
    price,
    is_available: readBoolean(raw.is_available ?? raw.isAvailable ?? raw.available) ?? true,
    sort_order: readNumber(raw.sort_order ?? raw.sortOrder ?? raw.display_order ?? raw.displayOrder),
  };
}

export function normalizeAddon(rawInput: unknown): MenuAddon {
  const raw = asRecord(rawInput) ?? {};
  const price = readPrice(raw.price ?? raw.base_price ?? raw.display_price) ?? 0;

  return {
    id: readNumber(raw.id ?? raw.ID ?? raw.addon_id ?? raw.addonId) ?? 0,
    name: readString(raw.name ?? raw.addon_name ?? raw.addonName) ?? 'Add-on',
    price,
    is_available: readBoolean(raw.is_available ?? raw.isAvailable ?? raw.available) ?? true,
    max_quantity: readNumber(raw.max_quantity ?? raw.maxQuantity),
    sort_order: readNumber(raw.sort_order ?? raw.sortOrder ?? raw.display_order ?? raw.displayOrder),
  };
}

function normalizeCategoriesWithFlatItems(
  categoriesRaw: unknown[],
  flatItemsRaw: unknown[]
): MenuCategory[] {
  const flatItems = flatItemsRaw.map((item) => normalizeMenuItem(item));

  return categoriesRaw
    .map((categoryRaw) => {
      const category = normalizeMenuCategory(categoryRaw);
      const categoryItems = flatItems.filter((item) => item.category_id === category.id);
      return {
        ...category,
        items: dedupeItems([...(category.items ?? []), ...categoryItems]).sort(sortItems),
      };
    })
    .filter((category) => category.is_active !== false)
    .sort(sortCategories);
}

function normalizeMenuItemWithFallback(
  rawInput: unknown,
  fallback: { categoryId?: number; categoryName?: string }
): MenuItem {
  const raw = asRecord(rawInput) ?? {};
  const variants = (readArray(raw.variants) ?? readArray(raw.options) ?? []).map(normalizeVariant);
  const addons = normalizeAddons(raw);
  const foodType = readString(raw.food_type ?? raw.foodType);
  const isVegetarian =
    readBoolean(raw.is_vegetarian ?? raw.isVegetarian ?? raw.is_veg ?? raw.isVeg ?? raw.veg) ??
    (foodType ? foodType.toLowerCase() === 'veg' || foodType.toLowerCase() === 'vegetarian' : undefined);
  const price = readPrice(raw.price ?? raw.base_price ?? raw.basePrice ?? raw.display_price) ?? 0;
  const categoryId =
    readNumber(raw.category_id ?? raw.categoryId ?? raw.cat_id ?? raw.catId) ?? fallback.categoryId;
  const categoryName =
    readString(raw.category_name ?? raw.categoryName ?? raw.category ?? raw.category_title) ??
    fallback.categoryName;

  return {
    id: readNumber(raw.id ?? raw.ID ?? raw.item_id ?? raw.itemId) ?? 0,
    name: readString(raw.name ?? raw.item_name ?? raw.itemName) ?? 'Menu item',
    description: readString(raw.description),
    price,
    display_price: readString(raw.display_price ?? raw.displayPrice) ?? formatMoney(price),
    image_url: normalizeImageUrl(
      raw.image_url ?? raw.imageUrl ?? raw.image ?? raw.photo_url ?? raw.photoUrl ?? raw.thumbnail_url
    ),
    category_id: categoryId,
    category_name: categoryName,
    restaurant_id: readNumber(raw.restaurant_id ?? raw.restaurantId),
    is_available: readBoolean(raw.is_available ?? raw.isAvailable ?? raw.available) ?? true,
    is_veg: isVegetarian,
    is_vegetarian: isVegetarian,
    is_bestseller: readBoolean(raw.is_bestseller ?? raw.isBestseller ?? raw.bestseller),
    is_recommended: readBoolean(raw.is_recommended ?? raw.isRecommended ?? raw.recommended),
    is_popular: readBoolean(raw.is_popular ?? raw.isPopular ?? raw.popular),
    is_taxable: readBoolean(raw.is_taxable ?? raw.isTaxable),
    sort_order: readNumber(raw.sort_order ?? raw.sortOrder ?? raw.display_order ?? raw.displayOrder),
    display_order: readNumber(raw.display_order ?? raw.displayOrder ?? raw.sort_order ?? raw.sortOrder),
    food_type: foodType,
    cuisine_type: readString(raw.cuisine_type ?? raw.cuisineType),
    spicy_level: readString(raw.spicy_level ?? raw.spicyLevel),
    preparation_time: readNumber(raw.preparation_time ?? raw.preparationTime),
    rating: readNumber(raw.rating ?? raw.average_rating ?? raw.averageRating),
    rating_count: readNumber(raw.rating_count ?? raw.ratingCount ?? raw.total_ratings ?? raw.totalRatings),
    review_count: readNumber(raw.review_count ?? raw.reviewCount),
    variants,
    addons,
    has_variants: readBoolean(raw.has_variants ?? raw.hasVariants) ?? variants.length > 0,
    has_addons: readBoolean(raw.has_addons ?? raw.hasAddons) ?? addons.length > 0,
  };
}

function normalizeAddons(raw: Record<string, unknown>): MenuAddon[] {
  const direct = readArray(raw.addons);
  if (direct) return direct.map(normalizeAddon);

  const groups = readArray(raw.addon_groups) ?? readArray(raw.addonGroups);
  if (!groups) return [];

  return groups.flatMap((groupRaw) => {
    const group = asRecord(groupRaw);
    return (readArray(group?.addons) ?? []).map(normalizeAddon);
  });
}

function categoriesFromFlatItems(itemsRaw: unknown[]): MenuCategory[] {
  const normalizedItems = itemsRaw.map((item) => normalizeMenuItem(item));
  const groups = new Map<number, MenuCategory>();

  for (const item of normalizedItems) {
    const id = item.category_id ?? 0;
    const name = item.category_name ?? (id === 0 ? 'Recommended' : 'Menu');
    const existing = groups.get(id);

    if (existing) {
      existing.items = [...(existing.items ?? []), item];
      continue;
    }

    groups.set(id, {
      id,
      name,
      is_active: true,
      items: [item],
    });
  }

  return Array.from(groups.values())
    .map((category) => ({
      ...category,
      items: dedupeItems(category.items ?? []).sort(sortItems),
    }))
    .sort(sortCategories);
}

function dedupeItems(items: MenuItem[]): MenuItem[] {
  const byId = new Map<number, MenuItem>();
  const result: MenuItem[] = [];

  for (const item of items) {
    if (item.id && byId.has(item.id)) continue;
    if (item.id) byId.set(item.id, item);
    result.push(item);
  }

  return result;
}

function looksLikeFlatItems(values: unknown[]) {
  return values.some((value) => {
    const obj = asRecord(value);
    if (!obj) return false;
    return (
      'item_id' in obj ||
      'itemId' in obj ||
      'price' in obj ||
      'base_price' in obj ||
      'display_price' in obj
    ) && !Array.isArray(obj.items);
  });
}

function sortCategories(a: MenuCategory, b: MenuCategory) {
  const orderA = a.display_order ?? a.sort_order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.display_order ?? b.sort_order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name);
}

function sortItems(a: MenuItem, b: MenuItem) {
  const orderA = a.display_order ?? a.sort_order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.display_order ?? b.sort_order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name);
}

function readOfferBadge(raw: Record<string, unknown>): string | undefined {
  const explicit = readString(
    raw.offer_badge ??
      raw.offerBadge ??
      raw.promo_badge ??
      raw.promoBadge ??
      raw.discount_text ??
      raw.discountText ??
      raw.coupon_text ??
      raw.couponText
  );
  if (explicit) return explicit;

  const activeOffer = asRecord(raw.active_offer) ?? asRecord(raw.activeOffer) ?? asRecord(raw.offer);
  const activeOfferLabel = activeOffer
    ? readString(activeOffer.title ?? activeOffer.label ?? activeOffer.name ?? activeOffer.description)
    : undefined;
  if (activeOfferLabel) return activeOfferLabel;

  const discountValue = readNumber(raw.discount_value ?? raw.discountValue);
  if (!discountValue) return undefined;

  const discountType = readString(raw.discount_type ?? raw.discountType)?.toLowerCase();
  const maxDiscount = readPrice(raw.max_discount ?? raw.maxDiscount ?? raw.max_discount_amount);
  const prefix = discountType === 'percentage' || discountType === 'percent' ? `${discountValue}% OFF` : `${formatMoney(discountValue)} OFF`;
  return maxDiscount ? `${prefix} up to ${formatMoney(maxDiscount)}` : prefix;
}

function sanitizeDeliveryTime(value: string | undefined, distanceKm: number | undefined) {
  if (!value) return estimateDeliveryTime(distanceKm);

  const numbers = value.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  const largestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  if (largestNumber > 120 || value.includes('970')) return estimateDeliveryTime(distanceKm);

  return value.replace(/\bmins\b/i, 'mins');
}

function estimateDeliveryTime(distanceKm: number | undefined) {
  if (distanceKm == null) return undefined;
  if (distanceKm <= 2) return '20-30 mins';
  if (distanceKm <= 5) return '30-40 mins';
  if (distanceKm <= 7) return '40-50 mins';
  return undefined;
}

function readDistanceKm(primary: unknown, fallbackDistance: unknown) {
  const direct = readNumber(primary);
  if (direct != null) return direct;

  if (typeof fallbackDistance === 'number') return fallbackDistance;
  if (typeof fallbackDistance !== 'string') return undefined;

  const normalized = fallbackDistance.trim().toLowerCase();
  const numericValue = readNumber(normalized.replace(/[^\d.]/g, ''));
  if (numericValue == null) return undefined;

  if (normalized.includes('km')) return numericValue;
  if (normalized.includes('m')) return numericValue / 1000;
  return numericValue;
}

function splitCuisineText(value: string | undefined) {
  if (!value) return undefined;
  const parts = value
    .split(/[,&|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const values = value
      .map((item) => readString(item))
      .filter((item): item is string => Boolean(item));
    return values.length > 0 ? values : undefined;
  }

  return splitCuisineText(readString(value));
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readPrice(value: unknown): number | undefined {
  const direct = readNumber(value);
  if (direct != null) return direct;
  if (typeof value !== 'string') return undefined;

  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'active', 'open'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'inactive', 'closed'].includes(normalized)) return false;
  }
  return undefined;
}

function readArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
