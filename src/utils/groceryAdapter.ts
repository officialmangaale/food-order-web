import { normalizeImageUrl } from '@/utils/imageUrl';
import { formatDistance } from '@/utils/distance';
import type {
  GroceryCartValidateResponse,
  GroceryMerchant,
  GroceryMerchantProducts,
  GroceryPlaceOrderResponse,
  GroceryProduct,
  GroceryProductCategory,
  GroceryTrackingAddress,
  GroceryTrackingItem,
  GroceryTrackingOrder,
  GroceryOrderStatus,
} from '@/types/grocery';

export function normalizeGroceryMerchants(raw: unknown): GroceryMerchant[] {
  const payload = unwrap(raw);
  const root = asRecord(payload);
  const values = Array.isArray(payload)
    ? payload
    : readArray(root?.merchants) ??
      readArray(root?.items) ??
      readArray(root?.results) ??
      readArray(root?.stores) ??
      [];

  const byId = new Map<number, GroceryMerchant>();

  for (const value of values) {
    if (isLikelyInternalStockPoint(value)) continue;
    const merchant = normalizeGroceryMerchant(value);
    if (!merchant || !merchant.id) continue;
    if (!byId.has(merchant.id)) byId.set(merchant.id, merchant);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const distanceA = a.distance_km ?? Number.POSITIVE_INFINITY;
    const distanceB = b.distance_km ?? Number.POSITIVE_INFINITY;
    if (distanceA !== distanceB) return distanceA - distanceB;
    return a.name.localeCompare(b.name);
  });
}

export function normalizeGroceryMerchant(rawInput: unknown): GroceryMerchant | null {
  const raw = asRecord(rawInput);
  if (!raw) return null;

  const id = readNumber(raw.id ?? raw.grocery_merchant_id ?? raw.groceryMerchantId ?? raw.merchant_id ?? raw.merchantId);
  const name = readString(
    raw.name ?? raw.display_name ?? raw.displayName ?? raw.public_name ?? raw.publicName ?? raw.merchant_name ?? raw.merchantName
  );
  if (!id || !name) return null;

  const distanceKm = readDistanceKm(raw.distance_km ?? raw.distanceKm, raw.distance);
  const deliveryFee = readNumber(raw.delivery_fee ?? raw.deliveryFee ?? raw.delivery_charge ?? raw.deliveryCharge);
  const isOpen = readBoolean(
    raw.is_open ?? raw.isOpen ?? raw.open ?? raw.is_accepting_orders ?? raw.isAcceptingOrders ?? raw.accepting_orders
  );
  const tags = readStringArray(raw.tags) ?? [];
  const deliveryTime = readString(
    raw.estimated_delivery_time ?? raw.estimatedDeliveryTime ?? raw.delivery_time ?? raw.deliveryTime
  ) ?? estimateDeliveryTime(distanceKm);

  return {
    id,
    name,
    slug: readString(raw.slug ?? raw.url_slug ?? raw.merchant_slug ?? raw.merchantSlug),
    logo_url: normalizeImageUrl(raw.logo_url ?? raw.logoUrl ?? raw.logo),
    banner_url: normalizeImageUrl(
      raw.banner_url ?? raw.bannerUrl ?? raw.cover_image ?? raw.coverImage ?? raw.image_url ?? raw.imageUrl
    ),
    distance_km: distanceKm,
    distance: readString(raw.distance) ?? (distanceKm != null ? formatDistance(distanceKm) : undefined),
    delivery_time: deliveryTime,
    is_open: isOpen ?? true,
    delivery_fee: deliveryFee,
    tags: tags.length > 0 ? tags : ['Daily essentials'],
  };
}

export function normalizeGroceryProducts(raw: unknown, fallbackMerchantId?: number): GroceryMerchantProducts {
  const payload = unwrap(raw);
  const root = asRecord(payload);
  const merchant =
    normalizeGroceryMerchant(root?.merchant ?? root?.grocery_merchant ?? root?.groceryMerchant ?? root?.store) ??
    null;
  const categoryRaw =
    readArray(root?.categories) ??
    readArray(root?.product_categories) ??
    readArray(root?.productCategories) ??
    [];
  const flatProductsRaw =
    Array.isArray(payload)
      ? payload
      : readArray(root?.products) ??
        readArray(root?.items) ??
        readArray(root?.results) ??
        readArray(root?.grocery_products) ??
        [];

  const categories =
    categoryRaw.length > 0
      ? normalizeProductCategories(categoryRaw, flatProductsRaw, merchant?.id ?? fallbackMerchantId)
      : categoriesFromProducts(flatProductsRaw, merchant?.id ?? fallbackMerchantId);
  const products = dedupeProducts(categories.flatMap((category) => category.products));

  return {
    merchant,
    categories,
    products,
  };
}

export function normalizeGroceryProduct(rawInput: unknown, fallbackMerchantId?: number): GroceryProduct | null {
  const raw = asRecord(rawInput);
  if (!raw) return null;

  const active = readBoolean(raw.is_active ?? raw.isActive ?? raw.active);
  if (active === false) return null;

  const id = readNumber(raw.id ?? raw.grocery_product_id ?? raw.groceryProductId ?? raw.product_id ?? raw.productId);
  const name = readString(raw.name ?? raw.product_name ?? raw.productName ?? raw.title);
  if (!id || !name) return null;

  const mrp = readNumber(raw.mrp ?? raw.max_retail_price ?? raw.maxRetailPrice ?? raw.list_price ?? raw.listPrice);
  const sellingPrice =
    readNumber(raw.selling_price ?? raw.sellingPrice ?? raw.sale_price ?? raw.salePrice ?? raw.price) ?? mrp ?? 0;
  const categoryId =
    readString(raw.category_id ?? raw.categoryId ?? raw.category_key ?? raw.categoryKey) ??
    readNumber(raw.category_id ?? raw.categoryId)?.toString();
  const categoryName =
    readString(raw.category_name ?? raw.categoryName ?? raw.category ?? raw.category_title ?? raw.categoryTitle) ??
    'Daily essentials';
  const stockStatus = readString(raw.stock_status ?? raw.stockStatus)?.toLowerCase();
  const available =
    readBoolean(raw.is_available ?? raw.isAvailable ?? raw.available ?? raw.in_stock ?? raw.inStock) ??
    (stockStatus ? !['out_of_stock', 'out of stock', 'sold_out', 'sold out', 'unavailable'].includes(stockStatus) : true);

  return {
    id,
    grocery_merchant_id:
      readNumber(raw.grocery_merchant_id ?? raw.groceryMerchantId ?? raw.merchant_id ?? raw.merchantId) ??
      fallbackMerchantId,
    name,
    brand: readString(raw.brand ?? raw.brand_name ?? raw.brandName),
    package_size: readString(
      raw.package_size ?? raw.packageSize ?? raw.pack_size ?? raw.packSize ?? raw.weight ?? raw.size
    ),
    image_url: normalizeImageUrl(raw.image_url ?? raw.imageUrl ?? raw.image ?? raw.photo_url ?? raw.photoUrl),
    category_id: categoryId,
    category_name: categoryName,
    mrp,
    selling_price: sellingPrice,
    is_available: available,
  };
}

export function normalizeGroceryCartValidation(raw: unknown): GroceryCartValidateResponse {
  const payload = unwrap(raw);
  const data = asRecord(payload) ?? {};
  const warnings = readStringArray(data.warnings) ?? readStringArray(data.messages) ?? [];
  const itemErrorsRaw = readArray(data.item_errors) ?? readArray(data.itemErrors) ?? [];
  const message = readString(data.message ?? data.error);
  const valid =
    readBoolean(data.valid ?? data.success ?? data.can_fulfill ?? data.canFulfill) ??
    !(message && /not available|cannot fulfill|too far|no fulfillment/i.test(message));
  const itemErrors: GroceryCartValidateResponse['item_errors'] = [];

  for (const item of itemErrorsRaw) {
    const obj = asRecord(item);
    const itemMessage = readString(obj?.message ?? obj?.error ?? obj?.reason);
    if (!itemMessage) continue;

    const groceryProductId = readNumber(obj?.grocery_product_id ?? obj?.groceryProductId);
    const productId = readNumber(obj?.product_id ?? obj?.productId);
    itemErrors.push({
      ...(groceryProductId != null ? { grocery_product_id: groceryProductId } : {}),
      ...(productId != null ? { product_id: productId } : {}),
      message: itemMessage,
    });
  }

  return {
    valid,
    subtotal: readNumber(data.subtotal) ?? 0,
    delivery_fee: readNumber(data.delivery_fee ?? data.deliveryFee ?? data.delivery_charge ?? data.deliveryCharge) ?? 0,
    grand_total:
      readNumber(data.grand_total ?? data.grandTotal ?? data.total ?? data.payable_total ?? data.payableTotal) ?? 0,
    warnings,
    message,
    item_errors: itemErrors,
  };
}

export function normalizeGroceryOrderResponse(raw: unknown): GroceryPlaceOrderResponse {
  const payload = unwrap(raw);
  const data = asRecord(payload) ?? {};
  const order = asRecord(data.order) ?? data;

  return {
    order_id: readNumber(order.order_id ?? order.orderId ?? order.id) ?? 0,
    order_number: readString(order.order_number ?? order.orderNumber),
    status: normalizeGroceryStatus(order.status ?? order.order_status ?? order.orderStatus),
    grand_total: readNumber(order.grand_total ?? order.grandTotal ?? order.total),
    message: readString(order.message),
  };
}

export function normalizeGroceryTrackingOrder(raw: unknown): GroceryTrackingOrder {
  const payload = unwrap(raw);
  const data = asRecord(payload) ?? {};
  const order = asRecord(data.order) ?? data;
  const merchant = asRecord(order.merchant) ?? asRecord(order.grocery_merchant) ?? {};
  const address = normalizeTrackingAddress(order.delivery_address ?? order.deliveryAddress ?? order.address);
  const items = (readArray(order.items) ?? readArray(order.order_items) ?? readArray(order.orderItems) ?? [])
    .map(normalizeTrackingItem)
    .filter((item): item is GroceryTrackingItem => Boolean(item));
  const warnings = readStringArray(order.warnings) ?? [];
  const orderId = readNumber(order.order_id ?? order.orderId ?? order.id) ?? readString(order.order_id ?? order.orderId ?? order.id) ?? 0;
  const orderNumber = readString(order.order_number ?? order.orderNumber);

  return {
    order_id: orderId,
    order_number: orderNumber,
    display_order_id: orderNumber ?? `#${orderId}`,
    status: normalizeGroceryStatus(order.status ?? order.order_status ?? order.orderStatus),
    merchant_name:
      readString(merchant.name ?? merchant.display_name ?? merchant.displayName ?? order.merchant_name ?? order.merchantName) ??
      'Mangaale Rasan',
    items,
    subtotal: readNumber(order.subtotal) ?? 0,
    delivery_fee: readNumber(order.delivery_fee ?? order.deliveryFee ?? order.delivery_charge ?? order.deliveryCharge) ?? 0,
    grand_total: readNumber(order.grand_total ?? order.grandTotal ?? order.total) ?? 0,
    payment_method: readString(order.payment_method ?? order.paymentMethod) ?? 'cash',
    delivery_address: address,
    warnings,
    placed_at: readString(order.placed_at ?? order.placedAt ?? order.created_at ?? order.createdAt),
    accepted_at: readString(order.accepted_at ?? order.acceptedAt),
    packing_at: readString(order.packing_at ?? order.packingAt),
    packed_at: readString(order.packed_at ?? order.packedAt),
    out_for_delivery_at: readString(order.out_for_delivery_at ?? order.outForDeliveryAt),
    delivered_at: readString(order.delivered_at ?? order.deliveredAt),
  };
}

function normalizeProductCategories(
  categoryRaw: unknown[],
  flatProductsRaw: unknown[],
  fallbackMerchantId?: number
): GroceryProductCategory[] {
  const flatProducts = flatProductsRaw
    .map((product) => normalizeGroceryProduct(product, fallbackMerchantId))
    .filter((product): product is GroceryProduct => Boolean(product));

  return categoryRaw
    .map((category) => {
      const raw = asRecord(category) ?? {};
      const id =
        readString(raw.id ?? raw.category_id ?? raw.categoryId ?? raw.key) ??
        readNumber(raw.id ?? raw.category_id ?? raw.categoryId)?.toString() ??
        'daily-essentials';
      const name = readString(raw.name ?? raw.category_name ?? raw.categoryName ?? raw.title) ?? 'Daily essentials';
      const nestedProducts = (readArray(raw.products) ?? readArray(raw.items) ?? [])
        .map((product) => normalizeGroceryProduct(product, fallbackMerchantId))
        .filter((product): product is GroceryProduct => Boolean(product))
        .map((product) => ({
          ...product,
          category_id: product.category_id ?? id,
          category_name: product.category_name ?? name,
        }));
      const categoryProducts = flatProducts.filter(
        (product) => product.category_id === id || product.category_name === name
      );

      return {
        id,
        name,
        products: dedupeProducts([...nestedProducts, ...categoryProducts]),
      };
    })
    .filter((category) => category.products.length > 0);
}

function categoriesFromProducts(productsRaw: unknown[], fallbackMerchantId?: number): GroceryProductCategory[] {
  const groups = new Map<string, GroceryProductCategory>();

  for (const raw of productsRaw) {
    const product = normalizeGroceryProduct(raw, fallbackMerchantId);
    if (!product) continue;

    const id = product.category_id ?? slugish(product.category_name ?? 'Daily essentials');
    const name = product.category_name ?? 'Daily essentials';
    const current = groups.get(id);
    if (current) {
      current.products.push(product);
    } else {
      groups.set(id, { id, name, products: [product] });
    }
  }

  return Array.from(groups.values()).map((category) => ({
    ...category,
    products: dedupeProducts(category.products),
  }));
}

function normalizeTrackingItem(rawInput: unknown): GroceryTrackingItem | null {
  const raw = asRecord(rawInput);
  if (!raw) return null;

  const name = readString(raw.name ?? raw.product_name ?? raw.productName);
  if (!name) return null;

  return {
    grocery_product_id: readNumber(raw.grocery_product_id ?? raw.groceryProductId ?? raw.product_id ?? raw.productId),
    name,
    brand: readString(raw.brand ?? raw.brand_name ?? raw.brandName),
    package_size: readString(raw.package_size ?? raw.packageSize ?? raw.pack_size ?? raw.packSize ?? raw.size),
    quantity: readNumber(raw.quantity ?? raw.qty) ?? 1,
    unit_price: readNumber(raw.unit_price ?? raw.unitPrice ?? raw.price ?? raw.selling_price ?? raw.sellingPrice),
    line_total: readNumber(raw.line_total ?? raw.lineTotal ?? raw.total),
  };
}

function normalizeTrackingAddress(rawInput: unknown): GroceryTrackingAddress | undefined {
  if (typeof rawInput === 'string') {
    const address = readString(rawInput);
    return address ? { address } : undefined;
  }

  const raw = asRecord(rawInput);
  if (!raw) return undefined;
  const address =
    readString(raw.address ?? raw.address_line1 ?? raw.addressLine1 ?? raw.full_address ?? raw.fullAddress) ??
    [raw.address_line1, raw.area, raw.city, raw.pincode].map(readString).filter(Boolean).join(', ');

  return {
    address: address || undefined,
    landmark: readString(raw.landmark ?? raw.delivery_landmark ?? raw.deliveryLandmark),
    latitude: readNumber(raw.latitude ?? raw.lat),
    longitude: readNumber(raw.longitude ?? raw.lng ?? raw.lon),
  };
}

function normalizeGroceryStatus(value: unknown): GroceryOrderStatus {
  const normalized = readString(value)?.toLowerCase().replace(/[\s-]+/g, '_');

  if (normalized === 'confirmed') return 'accepted';
  if (normalized === 'preparing') return 'packing';
  if (normalized === 'ready') return 'packed';
  if (normalized === 'picked_up') return 'out_for_delivery';

  if (
    normalized === 'placed' ||
    normalized === 'accepted' ||
    normalized === 'packing' ||
    normalized === 'packed' ||
    normalized === 'out_for_delivery' ||
    normalized === 'delivered' ||
    normalized === 'cancelled' ||
    normalized === 'rejected'
  ) {
    return normalized;
  }

  return 'placed';
}

function isLikelyInternalStockPoint(rawInput: unknown) {
  const raw = asRecord(rawInput);
  if (!raw) return false;

  const internal = readBoolean(raw.is_internal ?? raw.isInternal ?? raw.internal);
  if (internal === true) return true;

  const kind = readString(
    raw.type ?? raw.store_type ?? raw.storeType ?? raw.merchant_type ?? raw.merchantType ?? raw.visibility
  )?.toLowerCase();
  if (kind && /internal|fulfillment|stock[_\s-]?point|warehouse/.test(kind)) return true;

  const displayName = readString(
    raw.name ?? raw.display_name ?? raw.displayName ?? raw.public_name ?? raw.publicName ?? raw.merchant_name
  )?.toLowerCase();
  if (!displayName) return false;

  return /owner\s+house|friend\s+house|\boffice\b/.test(displayName);
}

function dedupeProducts(products: GroceryProduct[]) {
  const byId = new Map<number, GroceryProduct>();
  const result: GroceryProduct[] = [];
  for (const product of products) {
    if (product.id && byId.has(product.id)) continue;
    if (product.id) byId.set(product.id, product);
    result.push(product);
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function readDistanceKm(primary: unknown, fallback: unknown) {
  const direct = readNumber(primary);
  if (direct != null) return direct;

  if (typeof fallback === 'number') return fallback;
  if (typeof fallback !== 'string') return undefined;

  const normalized = fallback.trim().toLowerCase();
  const numeric = readNumber(normalized.replace(/[^\d.]/g, ''));
  if (numeric == null) return undefined;
  if (normalized.includes('km')) return numeric;
  if (normalized.includes('m')) return numeric / 1000;
  return numeric;
}

function estimateDeliveryTime(distanceKm: number | undefined) {
  if (distanceKm == null) return undefined;
  if (distanceKm <= 2) return '20-30 min';
  if (distanceKm <= 5) return '30-40 min';
  return '40-50 min';
}

function unwrap(value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    const obj = asRecord(current);
    if (!obj || !('data' in obj) || obj.data === undefined) break;
    current = obj.data;
  }
  return current;
}

function slugish(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'daily-essentials';
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(readString).filter((item): item is string => Boolean(item));
  return values.length > 0 ? values : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
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
    if (['true', '1', 'yes', 'open', 'active', 'available', 'success'].includes(normalized)) return true;
    if (['false', '0', 'no', 'closed', 'inactive', 'unavailable', 'failed'].includes(normalized)) return false;
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
