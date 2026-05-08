import { ORDER_STATUS_LABELS } from '@/types/order';
import type { CustomerOrder, CustomerOrderItem } from '@/services/customerOrdersApi';
import type { CustomerProfile } from '@/services/profileApi';
import type { CustomerUser } from '@/types/auth';

export function getProfileName(profile?: CustomerProfile | null, user?: CustomerUser | null, phone?: string | null) {
  return profile?.name || user?.name || profile?.phone || user?.phone || phone || 'Mangaale customer';
}

export function getProfilePhone(profile?: CustomerProfile | null, user?: CustomerUser | null, phone?: string | null) {
  return profile?.phone || user?.phone || phone || '';
}

export function getInitials(nameOrPhone: string) {
  const cleaned = nameOrPhone.trim();
  if (!cleaned) return 'M';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export function getPreferenceTags(profile?: CustomerProfile | null) {
  if (!profile) return [];
  if (Array.isArray(profile.tags)) return profile.tags.filter(Boolean);
  if (Array.isArray(profile.preferences)) return profile.preferences.filter(Boolean);
  if (profile.preferences && typeof profile.preferences === 'object') {
    return Object.values(profile.preferences)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  }
  return [];
}

export function getOrderDate(order: CustomerOrder) {
  const rawDate = order.placed_at || order.created_at || order.updated_at;
  if (!rawDate) return 'Date unavailable';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function getOrderTotal(order: CustomerOrder) {
  return order.total ?? order.final_total ?? order.grand_total ?? order.subtotal ?? 0;
}

export function getOrderStatusLabel(status: CustomerOrder['status']) {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? String(status);
}

export function getItemSummary(items?: CustomerOrderItem[]) {
  if (!items?.length) return 'Items unavailable';
  const summary = items
    .slice(0, 3)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
  return items.length > 3 ? `${summary} +${items.length - 3} more` : summary;
}
