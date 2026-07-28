import type {
  OrderSSEEvent,
  OrderStatus,
  TrackingOrder,
  TrackingOrderAddon,
  TrackingOrderAddress,
  TrackingOrderItem,
  TrackingOrderRider,
  TrackingOrderRestaurant,
} from '@/types/order';

const ORDER_STATUS_VALUES: OrderStatus[] = [
  'pending',
  'placed',
  'accepted',
  'confirmed',
  'preparing',
  'ready',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
  'rejected',
  'declined',
];

export function normalizeTrackingOrder(raw: unknown): TrackingOrder {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? root;
  const order = asRecord(data.order) ?? asRecord(root.order) ?? data;
  const restaurant = normalizeRestaurant(order, data);
  const customer = asRecord(order.customer) ?? asRecord(data.customer) ?? {};
  const items = normalizeItems(readArray(order.items ?? order.order_items ?? data.items ?? data.order_items));
  const summary = getBillingSummary(order, data);
  const subtotal = readBillingNumber(summary.record, order, data, ['subtotal', 'item_subtotal', 'itemSubtotal']);
  const cgst = readBillingNumber(summary.record, order, data, ['cgst']);
  const sgst = readBillingNumber(summary.record, order, data, ['sgst']);
  const taxAmount = readBillingNumber(summary.record, order, data, ['tax_amount', 'taxAmount', 'taxes']);
  const deliveryCharge = readBillingNumber(summary.record, order, data, [
    'delivery_charge',
    'deliveryCharge',
    'delivery_fee',
    'deliveryFee',
  ]);
  const discountAmount = readBillingNumber(summary.record, order, data, [
    'discount_amount',
    'discountAmount',
    'discount',
  ]);
  const offerDiscountAmount = readBillingNumber(summary.record, order, data, [
    'offer_discount_amount',
    'offerDiscountAmount',
  ]);
  const platformFeeAmount = readBillingNumber(summary.record, order, data, [
    'platform_fee_amount',
    'platformFeeAmount',
    'platform_fee',
    'platformFee',
  ]);
  const extraCharges = readBillingNumber(summary.record, order, data, ['extra_charges', 'extraCharges']);
  const roundOffAmount = readBillingNumber(summary.record, order, data, [
    'round_off_amount',
    'roundOffAmount',
    'round_off',
  ]);
  const exactTotalAmount = readBillingNumber(summary.record, order, data, ['exact_total_amount', 'exactTotalAmount']);
  const grandTotal = readBillingNumber(summary.record, order, data, [
    'grand_total',
    'grandTotal',
    'total_amount',
    'totalAmount',
    'exact_total_amount',
    'exactTotalAmount',
    'total',
    'amount',
    'payable_total',
    'payableTotal',
  ]);

  debugBillingSummary('tracking', order, data, summary, {
    subtotal,
    discount_amount: discountAmount,
    offer_discount_amount: offerDiscountAmount,
    delivery_fee: deliveryCharge,
    extra_charges: extraCharges,
    cgst,
    sgst,
    tax_amount: taxAmount,
    platform_fee_amount: platformFeeAmount,
    round_off_amount: roundOffAmount,
    exact_total_amount: exactTotalAmount,
    grand_total: grandTotal,
  });
  const orderId =
    readNumber(order.order_id ?? order.orderId ?? order.id ?? data.order_id ?? data.id) ??
    readString(order.order_id ?? order.orderId ?? order.id ?? data.order_id ?? data.id) ??
    '';
  const orderNumber = readString(order.order_number ?? order.orderNumber ?? data.order_number);
  const estimatedArrivalText = readString(
    order.estimated_delivery_time ??
      order.estimatedDeliveryTime ??
      order.estimated_arrival ??
      order.eta ??
      data.estimated_delivery_time
  );
  const estimatedMinutes =
    readNumber(order.estimated_minutes ?? order.estimatedMinutes ?? order.eta_minutes ?? data.estimated_minutes) ??
    parseMinutes(estimatedArrivalText);

  return {
    orderId,
    orderNumber,
    displayOrderId: formatDisplayOrderId(orderId),
    restaurant,
    customer: {
      name: readString(customer.name ?? order.customer_name ?? data.customer_name),
      phone: readString(customer.phone ?? customer.mobile ?? order.customer_phone ?? data.customer_phone),
    },
    items,
    itemCount:
      readNumber(order.item_count ?? order.itemCount ?? data.item_count) ??
      items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    cgst,
    sgst,
    taxAmount,
    deliveryCharge,
    discountAmount,
    offerDiscountAmount,
    platformFeeAmount,
    extraCharges,
    roundOffAmount,
    exactTotalAmount,
    grandTotal: grandTotal ?? 0,
    paymentMethod:
      readString(order.payment_method ?? order.paymentMethod ?? data.payment_method) ?? 'cash',
    paymentStatus:
      readString(order.payment_status ?? order.paymentStatus ?? data.payment_status) ?? 'pending',
    orderType: readString(
      order.order_type ?? order.orderType ?? data.order_type ?? data.orderType
    ),
    orderStatus: normalizeOrderStatus(
      order.order_status ?? order.orderStatus ?? order.status ?? data.order_status ?? data.status
    ),
    deliveryStatus: readString(
      order.delivery_status ?? order.deliveryStatus ?? data.delivery_status ?? data.deliveryStatus
    ),
    createdAt: readString(order.created_at ?? order.createdAt ?? order.placed_at ?? data.created_at),
    estimatedArrivalText,
    estimatedMinutes,
    deliveryAddress: normalizeAddress(order.delivery_address ?? order.deliveryAddress ?? data.delivery_address),
    rider: normalizeRider(order.rider ?? order.delivery_partner ?? order.deliveryPartner ?? data.rider),
    timeline: readArray(order.timeline ?? data.timeline),
    cancellationReason: readString(
      order.cancellation_reason ?? order.cancel_reason ?? order.reason ?? data.cancellation_reason
    ),
  };
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const normalized = normalizeToken(readString(value) ?? '');
  if (!normalized) return 'placed';
  if (normalized === 'accept' || normalized === 'accepted_by_restaurant') return 'accepted';
  if (normalized === 'confirm' || normalized === 'confirmed_by_restaurant') return 'confirmed';
  if (normalized === 'food_preparing' || normalized === 'in_kitchen') return 'preparing';
  if (normalized === 'ready_for_dispatch' || normalized === 'ready_to_pickup') return 'ready_for_pickup';
  if (normalized === 'pickup' || normalized === 'picked') return 'picked_up';
  if (normalized === 'dispatched' || normalized === 'on_the_way') return 'out_for_delivery';
  if (normalized === 'complete') return 'completed';
  if (normalized === 'canceled') return 'cancelled';
  if ((ORDER_STATUS_VALUES as string[]).includes(normalized)) return normalized as OrderStatus;
  return 'placed';
}

export function mergeTrackingOrderEvent(previous: TrackingOrder, event: OrderSSEEvent): TrackingOrder {
  const eventRecord = asRecord(event) ?? {};
  const dataRecord = asRecord(event.data) ?? eventRecord;
  const statusValue =
    dataRecord.order_status ??
    dataRecord.orderStatus ??
    dataRecord.status ??
    event.order_status ??
    event.status;
  const deliveryStatus = readString(dataRecord.delivery_status ?? dataRecord.deliveryStatus ?? event.delivery_status);
  const paymentStatus = readString(dataRecord.payment_status ?? dataRecord.paymentStatus ?? event.payment_status);
  const estimatedArrivalText = readString(
    dataRecord.estimated_delivery_time ?? dataRecord.estimatedDeliveryTime ?? dataRecord.eta
  );
  const timeline = readArray(dataRecord.timeline);

  return {
    ...previous,
    orderStatus: statusValue ? normalizeOrderStatus(statusValue) : previous.orderStatus,
    deliveryStatus: deliveryStatus ?? previous.deliveryStatus,
    paymentStatus: paymentStatus ?? previous.paymentStatus,
    estimatedArrivalText: estimatedArrivalText ?? previous.estimatedArrivalText,
    estimatedMinutes: parseMinutes(estimatedArrivalText) ?? previous.estimatedMinutes,
    timeline: timeline.length > 0 ? timeline : previous.timeline,
  };
}

function normalizeRestaurant(
  order: Record<string, unknown>,
  data: Record<string, unknown>
): TrackingOrderRestaurant {
  const restaurant = asRecord(order.restaurant) ?? asRecord(data.restaurant) ?? {};
  return {
    id: readNumber(
      restaurant.restaurant_id ?? restaurant.restaurantId ?? restaurant.id ?? order.restaurant_id ?? data.restaurant_id
    ),
    name:
      readString(restaurant.name ?? restaurant.restaurant_name ?? order.restaurant_name ?? data.restaurant_name) ??
      'Restaurant',
    logoUrl: readString(
      restaurant.logo_url ??
        restaurant.logoUrl ??
        order.restaurant_logo_url ??
        order.logo_url ??
        data.restaurant_logo_url
    ),
    phone: readString(restaurant.phone ?? restaurant.mobile ?? order.restaurant_phone ?? data.restaurant_phone),
  };
}

function normalizeItems(rawItems: unknown[]): TrackingOrderItem[] {
  return rawItems.map((raw, index) => {
    const item = asRecord(raw) ?? {};
    const quantity = Math.max(1, readNumber(item.quantity ?? item.qty) ?? 1);
    const unitPrice = readNumber(item.price ?? item.unit_price ?? item.unitPrice ?? item.base_price);
    const lineTotal =
      readNumber(item.line_total ?? item.lineTotal ?? item.total ?? item.amount) ??
      (unitPrice != null ? unitPrice * quantity : 0);
    const addons = normalizeAddons(readArray(item.addons ?? item.selected_addons));

    return {
      itemId: readNumber(item.item_id ?? item.itemId ?? item.id),
      name: readString(item.name ?? item.item_name ?? item.title) ?? `Item ${index + 1}`,
      quantity,
      unitPrice,
      lineTotal,
      variantName: readString(item.variant_name ?? item.variantName ?? asRecord(item.variant)?.name),
      addons,
    };
  });
}

function normalizeAddons(rawAddons: unknown[]): TrackingOrderAddon[] {
  return rawAddons.map((raw, index) => {
    const addon = asRecord(raw) ?? {};
    return {
      name: readString(addon.name ?? addon.addon_name ?? addon.title) ?? `Addon ${index + 1}`,
      quantity: readNumber(addon.quantity ?? addon.qty),
      price: readNumber(addon.price ?? addon.amount),
    };
  });
}

function normalizeAddress(raw: unknown): TrackingOrderAddress | undefined {
  const address = asRecord(raw);
  if (!address) return undefined;

  return {
    addressLine1: readString(address.address_line1 ?? address.addressLine1 ?? address.line1 ?? address.address),
    area: readString(address.area ?? address.locality),
    city: readString(address.city),
    state: readString(address.state),
    pincode: readString(address.pincode ?? address.postal_code ?? address.postalCode ?? address.zip),
    landmark: readString(address.landmark),
    latitude: readNumber(address.latitude ?? address.lat),
    longitude: readNumber(address.longitude ?? address.lng ?? address.lon),
  };
}

function normalizeRider(raw: unknown): TrackingOrderRider | null {
  const rider = asRecord(raw);
  if (!rider) return null;
  const name = readString(rider.name ?? rider.rider_name ?? rider.delivery_partner_name);
  const phone = readString(rider.phone ?? rider.mobile ?? rider.rider_phone);
  const vehicle = readString(rider.vehicle ?? rider.vehicle_number ?? rider.vehicleNumber);
  const photoUrl = readString(rider.photo_url ?? rider.photoUrl ?? rider.avatar_url);
  if (!name && !phone && !vehicle && !photoUrl) return null;
  return { name, phone, vehicle, photoUrl };
}

function formatDisplayOrderId(orderId: number | string) {
  const value = String(orderId || '').trim();
  if (!value) return '#';
  return value.startsWith('#') ? value : `#${value}`;
}

function parseMinutes(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const minutes = Number(match[0]);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) return undefined;
  return minutes;
}

function getBillingSummary(order: Record<string, unknown>, data: Record<string, unknown>) {
  const billBreakdown =
    asRecord(order.bill_breakdown) ??
    asRecord(order.billBreakdown) ??
    asRecord(order.billing_breakdown) ??
    asRecord(order.billingBreakdown) ??
    asRecord(data.bill_breakdown) ??
    asRecord(data.billBreakdown) ??
    asRecord(data.billing_breakdown) ??
    asRecord(data.billingBreakdown);
  if (billBreakdown) return { source: 'bill_breakdown', record: billBreakdown };

  const billBreakdownRows =
    asBillingRows(order.bill_breakdown) ??
    asBillingRows(order.billBreakdown) ??
    asBillingRows(order.billing_breakdown) ??
    asBillingRows(order.billingBreakdown) ??
    asBillingRows(data.bill_breakdown) ??
    asBillingRows(data.billBreakdown) ??
    asBillingRows(data.billing_breakdown) ??
    asBillingRows(data.billingBreakdown);
  if (billBreakdownRows) return { source: 'bill_breakdown', record: billBreakdownRows };

  const summary = asRecord(order.summary) ?? asRecord(data.summary);
  if (summary) return { source: 'summary', record: summary };

  const pricing = asRecord(order.pricing) ?? asRecord(data.pricing);
  if (pricing) return { source: 'pricing', record: pricing };

  return { source: 'root', record: order };
}

function asBillingRows(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value)) return null;

  const result: Record<string, unknown> = {};
  for (const rowValue of value) {
    const row = asRecord(rowValue);
    if (!row) continue;

    const key = readString(row.key ?? row.code ?? row.type ?? row.name ?? row.label ?? row.title);
    if (!key) continue;

    result[normalizeBillingKey(key)] =
      row.amount ?? row.value ?? row.price ?? row.total ?? row.fee ?? row.charge ?? row.discount_amount;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function normalizeBillingKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function readBillingNumber(
  summary: Record<string, unknown>,
  order: Record<string, unknown>,
  data: Record<string, unknown>,
  keys: string[]
) {
  const sources = summary === order ? [summary, data] : [summary, order, data];

  for (const source of sources) {
    for (const key of keys) {
      const value = readNumber(source[key]);
      if (value != null) return value;
    }
  }

  return undefined;
}

function debugBillingSummary(
  source: 'tracking',
  order: Record<string, unknown>,
  data: Record<string, unknown>,
  summary: { source: string; record: Record<string, unknown> },
  mapped: Record<string, number | undefined>
) {
  if (process.env.NODE_ENV === 'production') return;

  const renderedFields = Object.entries(mapped)
    .filter(([, value]) => value != null && value !== 0)
    .map(([key]) => key);

  console.debug('[checkout-billing]', {
    source,
    summaryObject: summary.source,
    orderKeys: Object.keys(order),
    dataKeys: Object.keys(data),
    summaryKeys: Object.keys(summary.record),
    renderedFields,
  });
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
