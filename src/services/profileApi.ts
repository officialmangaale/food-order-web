import { httpRequest, isAuthError, userServiceUrl } from './http';
import { getCustomerOrders, type CustomerOrder } from './customerOrdersApi';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { CustomerUser } from '@/types/auth';

export interface CustomerProfile extends CustomerUser {
  avatar_url?: string;
  preferences?: string[] | Record<string, unknown>;
  tags?: string[];
  orders_count?: number;
  total_orders?: number;
  reviews_count?: number;
  total_reviews?: number;
}

export interface CustomerAddress {
  id: number | string;
  label?: string;
  name?: string;
  phone?: string;
  address_line1: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface CustomerAddressPayload {
  label?: string;
  name?: string;
  phone?: string;
  address_line1: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface ProfileDashboard {
  profile: CustomerProfile | null;
  recentOrders: CustomerOrder[];
  addresses: CustomerAddress[];
  ordersCount: number;
  reviewsCount: number;
}

export async function getMe(token: string): Promise<CustomerProfile> {
  const raw = await httpRequest<unknown>(userServiceUrl('/customers/me'), { token });
  const data = unwrapApiResponse<unknown>(raw);
  return normalizeProfile(data);
}

export async function updateMe(
  token: string,
  payload: Partial<Pick<CustomerProfile, 'name' | 'email' | 'phone'>>
): Promise<CustomerProfile> {
  const raw = await httpRequest<unknown>(userServiceUrl('/customers/me'), {
    method: 'PATCH',
    token,
    body: payload,
  });
  const data = unwrapApiResponse<unknown>(raw);
  return normalizeProfile(data);
}

export async function getProfileDashboard(token: string): Promise<ProfileDashboard> {
  const [profileResult, ordersResult, addressesResult] = await Promise.allSettled([
    getMe(token),
    getCustomerOrders(token, { page: 1, limit: 2 }),
    getAddresses(token),
  ]);

  for (const result of [profileResult, ordersResult, addressesResult]) {
    if (result.status === 'rejected' && isAuthError(result.reason)) {
      throw result.reason;
    }
  }

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const ordersResponse = ordersResult.status === 'fulfilled' ? ordersResult.value : null;
  const addresses = addressesResult.status === 'fulfilled' ? addressesResult.value : [];
  const recentOrders = ordersResponse?.orders.slice(0, 2) ?? [];
  const ordersCount =
    profile?.orders_count ??
    profile?.total_orders ??
    ordersResponse?.total ??
    recentOrders.length;

  return {
    profile,
    recentOrders,
    addresses: addresses.slice(0, 2),
    ordersCount,
    reviewsCount: profile?.reviews_count ?? profile?.total_reviews ?? 0,
  };
}

export async function getAddresses(token: string): Promise<CustomerAddress[]> {
  const raw = await httpRequest<unknown>(userServiceUrl('/customers/me/addresses'), { token });
  const data = unwrapApiResponse<unknown>(raw);
  return normalizeAddresses(data);
}

export async function createAddress(
  token: string,
  payload: CustomerAddressPayload
): Promise<CustomerAddress> {
  const raw = await httpRequest<unknown>(userServiceUrl('/customers/me/addresses'), {
    method: 'POST',
    token,
    body: payload,
  });
  const data = unwrapApiResponse<unknown>(raw);
  return normalizeAddress(data as Record<string, unknown>);
}

export async function updateAddress(
  token: string,
  id: number | string,
  payload: CustomerAddressPayload
): Promise<CustomerAddress> {
  const raw = await httpRequest<unknown>(userServiceUrl(`/customers/me/addresses/${id}`), {
    method: 'PATCH',
    token,
    body: payload,
  });
  const data = unwrapApiResponse<unknown>(raw);
  return normalizeAddress(data as Record<string, unknown>);
}

export async function deleteAddress(token: string, id: number | string): Promise<void> {
  await httpRequest<unknown>(userServiceUrl(`/customers/me/addresses/${id}`), {
    method: 'DELETE',
    token,
  });
}

function normalizeProfile(raw: unknown): CustomerProfile {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const user =
    data.user && typeof data.user === 'object'
      ? (data.user as Record<string, unknown>)
      : data.customer && typeof data.customer === 'object'
        ? (data.customer as Record<string, unknown>)
        : data;

  return {
    id: toNumber(user.id ?? user.user_id),
    user_id: toNumber(user.user_id),
    name: user.name as string | undefined,
    phone: (user.phone as string | undefined) ?? '',
    email: user.email as string | undefined,
    avatar_url: (user.avatar_url ?? user.avatar) as string | undefined,
    preferences: user.preferences as string[] | Record<string, unknown> | undefined,
    tags: Array.isArray(user.tags) ? (user.tags as string[]) : undefined,
    orders_count: toNumber(user.orders_count),
    total_orders: toNumber(user.total_orders),
    reviews_count: toNumber(user.reviews_count),
    total_reviews: toNumber(user.total_reviews),
  };
}

function normalizeAddresses(raw: unknown): CustomerAddress[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((address) => normalizeAddress(address as Record<string, unknown>));
  }

  const data = raw as Record<string, unknown>;
  const addresses =
    pickArray(data.addresses) ??
    pickArray(data.items) ??
    pickArray(data.results) ??
    [];

  return addresses.map((address) => normalizeAddress(address as Record<string, unknown>));
}

function normalizeAddress(raw: Record<string, unknown>): CustomerAddress {
  return {
    id: (raw.id ?? raw.address_id ?? `local-${Date.now()}`) as number | string,
    label: (raw.label ?? raw.type ?? raw.address_type) as string | undefined,
    name: raw.name as string | undefined,
    phone: raw.phone as string | undefined,
    address_line1: (raw.address_line1 ?? raw.line1 ?? raw.address ?? '') as string,
    area: raw.area as string | undefined,
    city: raw.city as string | undefined,
    state: raw.state as string | undefined,
    pincode: (raw.pincode ?? raw.postal_code ?? raw.zip) as string | undefined,
    landmark: raw.landmark as string | undefined,
    latitude: toNumber(raw.latitude ?? raw.lat),
    longitude: toNumber(raw.longitude ?? raw.lng ?? raw.lon),
    is_default: Boolean(raw.is_default ?? raw.default),
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
