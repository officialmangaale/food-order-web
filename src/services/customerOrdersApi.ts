import { restaurantGet } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { OrderStatus } from '@/types/order';

export interface CustomerOrderItem {
  item_id?: number;
  id?: number;
  name: string;
  quantity: number;
  price?: number;
  variant_id?: number;
  variant_name?: string;
  addons?: { addon_id?: number; name: string; quantity: number; price?: number }[];
}

export interface CustomerOrder {
  order_id: number | string;
  id?: number | string;
  order_number?: string;
  restaurant_id?: number | string;
  restaurant_name?: string;
  status: OrderStatus | string;
  created_at?: string;
  placed_at?: string;
  updated_at?: string;
  items: CustomerOrderItem[];
  subtotal?: number;
  total?: number;
  grand_total?: number;
  final_total?: number;
}

export interface CustomerOrdersResponse {
  orders: CustomerOrder[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CustomerOrdersParams {
  page?: number;
  limit?: number;
}

export async function getCustomerOrders(
  token: string,
  params: CustomerOrdersParams = {}
): Promise<CustomerOrdersResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 10));

  const raw = await restaurantGet<unknown>(`/customer-web/orders?${query.toString()}`, token);
  const data = unwrapApiResponse<unknown>(raw);
  return normalizeOrdersResponse(data, params);
}

export async function getActiveOrder(token: string): Promise<CustomerOrder | null> {
  const raw = await restaurantGet<unknown>('/customer-web/orders/active', token);
  const data = unwrapApiResponse<unknown>(raw);
  if (!data) return null;

  if (Array.isArray(data)) {
    return data.length ? normalizeOrder(data[0] as Record<string, unknown>) : null;
  }

  const objectData = data as Record<string, unknown>;
  const order =
    (objectData.order as Record<string, unknown> | undefined) ??
    (objectData.active_order as Record<string, unknown> | undefined) ??
    objectData;

  return normalizeOrder(order);
}

function normalizeOrdersResponse(raw: unknown, params: CustomerOrdersParams): CustomerOrdersResponse {
  if (!raw) {
    return { orders: [], page: params.page ?? 1, limit: params.limit ?? 10, total: 0 };
  }

  if (Array.isArray(raw)) {
    return {
      orders: raw.map((order) => normalizeOrder(order as Record<string, unknown>)),
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      total: raw.length,
    };
  }

  const data = raw as Record<string, unknown>;
  const ordersRaw =
    pickArray(data.orders) ??
    pickArray(data.items) ??
    pickArray(data.results) ??
    pickArray(data.rows) ??
    [];

  return {
    orders: ordersRaw.map((order) => normalizeOrder(order as Record<string, unknown>)),
    page: toNumber(data.page) ?? params.page ?? 1,
    limit: toNumber(data.limit) ?? params.limit ?? 10,
    total: toNumber(data.total) ?? toNumber(data.count) ?? ordersRaw.length,
  };
}

function normalizeOrder(raw: Record<string, unknown>): CustomerOrder {
  const restaurant =
    raw.restaurant && typeof raw.restaurant === 'object'
      ? (raw.restaurant as Record<string, unknown>)
      : undefined;
  const itemsRaw =
    pickArray(raw.items) ??
    pickArray(raw.order_items) ??
    pickArray(raw.line_items) ??
    [];

  return {
    order_id: (raw.order_id ?? raw.id ?? raw.ID ?? '') as number | string,
    id: (raw.id ?? raw.ID) as number | string | undefined,
    order_number: (raw.order_number ?? raw.number) as string | undefined,
    restaurant_id: (raw.restaurant_id ?? restaurant?.id) as number | string | undefined,
    restaurant_name: (raw.restaurant_name ?? restaurant?.name ?? 'Restaurant') as string,
    status: (raw.status ?? 'placed') as OrderStatus | string,
    created_at: (raw.created_at ?? raw.createdAt) as string | undefined,
    placed_at: (raw.placed_at ?? raw.ordered_at) as string | undefined,
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
    items: itemsRaw.map((item) => normalizeOrderItem(item as Record<string, unknown>)),
    subtotal: toNumber(raw.subtotal),
    total: toNumber(raw.total),
    grand_total: toNumber(raw.grand_total),
    final_total: toNumber(raw.final_total),
  };
}

function normalizeOrderItem(raw: Record<string, unknown>): CustomerOrderItem {
  const menuItem =
    raw.menu_item && typeof raw.menu_item === 'object'
      ? (raw.menu_item as Record<string, unknown>)
      : undefined;

  return {
    item_id: toNumber(raw.item_id ?? raw.menu_item_id ?? menuItem?.id),
    id: toNumber(raw.id ?? raw.ID),
    name: (raw.name ?? raw.item_name ?? menuItem?.name ?? 'Item') as string,
    quantity: toNumber(raw.quantity ?? raw.qty) ?? 1,
    price: toNumber(raw.price ?? raw.unit_price ?? raw.total_price),
    variant_id: toNumber(raw.variant_id),
    variant_name: raw.variant_name as string | undefined,
    addons: pickArray(raw.addons)?.map((addon) => {
      const addonRaw = addon as Record<string, unknown>;
      return {
        addon_id: toNumber(addonRaw.addon_id ?? addonRaw.id),
        name: (addonRaw.name ?? addonRaw.addon_name ?? 'Addon') as string,
        quantity: toNumber(addonRaw.quantity ?? addonRaw.qty) ?? 1,
        price: toNumber(addonRaw.price),
      };
    }),
  };
}

function pickArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
