export type OrderStatus =
  | 'pending'
  | 'placed'
  | 'accepted'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'declined';

export interface DeliveryAddress {
  address_line1: string;
  area: string;
  city: string;
  state?: string;
  pincode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export interface PlaceOrderDeliveryAddress {
  address_line1: string;
  area: string;
  city: string;
  state?: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlaceOrderRequest {
  restaurant_id: number;
  payment_method: 'cash';
  coupon_code?: string;
  campaign_id?: number;
  utm_source?: string;
  utm_campaign?: string;
  customer: {
    name: string;
    phone: string;
  };
  delivery_address: PlaceOrderDeliveryAddress;
  items: {
    item_id: number;
    quantity: number;
    variant_id?: number;
    addons?: { addon_id: number; quantity: number }[];
  }[];
  special_instructions?: string;
}

export interface PlaceOrderResponse {
  order_id: number;
  order_number?: string;
  status: OrderStatus;
  payment_status?: string;
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  tax_amount?: number;
  discount_amount?: number;
  offer_discount_amount?: number;
  delivery_fee?: number;
  platform_fee_amount?: number;
  extra_charges?: number;
  round_off_amount?: number;
  exact_total_amount?: number;
  grand_total?: number;
  total?: number;
  tracking_url?: string;
  message?: string;
}

export interface OrderTrackingResponse {
  order_id: number;
  order_number?: string;
  status: OrderStatus;
  restaurant_id: number;
  restaurant_name?: string;
  restaurant_phone?: string;
  restaurant_logo_url?: string;
  items?: OrderItem[];
  subtotal?: number;
  taxes?: number;
  delivery_fee?: number;
  discount?: number;
  total?: number;
  payment_method?: string;
  delivery_address?: DeliveryAddress;
  rider?: RiderInfo;
  special_instructions?: string;
  placed_at?: string;
  accepted_at?: string;
  preparing_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  estimated_delivery_time?: string;
  created_at?: string;
}

export interface OrderItem {
  item_id: number;
  name: string;
  quantity: number;
  price: number;
  variant_name?: string;
  addons?: { name: string; quantity: number; price: number }[];
}

export interface RiderInfo {
  name?: string;
  phone?: string;
  vehicle_number?: string;
}

export interface TrackingOrderRestaurant {
  id?: number;
  name: string;
  logoUrl?: string;
  phone?: string;
}

export interface TrackingOrderCustomer {
  name?: string;
  phone?: string;
}

export interface TrackingOrderAddress {
  addressLine1?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface TrackingOrderRider {
  name?: string;
  phone?: string;
  vehicle?: string;
  photoUrl?: string;
}

export interface TrackingOrderAddon {
  name: string;
  quantity?: number;
  price?: number;
}

export interface TrackingOrderItem {
  itemId?: number;
  name: string;
  quantity: number;
  unitPrice?: number;
  lineTotal: number;
  variantName?: string;
  addons: TrackingOrderAddon[];
}

export interface TrackingOrder {
  orderId: number | string;
  orderNumber?: string;
  displayOrderId: string;
  restaurant: TrackingOrderRestaurant;
  customer: TrackingOrderCustomer;
  items: TrackingOrderItem[];
  itemCount: number;
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  taxAmount?: number;
  deliveryCharge?: number;
  discountAmount?: number;
  offerDiscountAmount?: number;
  platformFeeAmount?: number;
  extraCharges?: number;
  roundOffAmount?: number;
  exactTotalAmount?: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  deliveryStatus?: string;
  createdAt?: string;
  estimatedArrivalText?: string;
  estimatedMinutes?: number;
  deliveryAddress?: TrackingOrderAddress;
  rider?: TrackingOrderRider | null;
  timeline?: unknown[];
  cancellationReason?: string;
}

/** Active order stored locally for home page card */
export interface ActiveOrder {
  order_id: number;
  restaurant_id: number;
  restaurant_name: string;
  status: OrderStatus;
  total?: number;
  created_at: string;
  customer_id?: number;
  customer_phone?: string;
}

/** SSE event data from /orders/:id/live */
export interface OrderSSEEvent {
  type: string;
  order_id?: number;
  status?: OrderStatus;
  order_status?: OrderStatus;
  delivery_status?: string;
  payment_status?: string;
  data?: Partial<OrderTrackingResponse> | Record<string, unknown>;
  message?: string;
  timestamp?: string;
}

/** Maps backend status to user-friendly labels */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  placed: 'Order Placed',
  accepted: 'Accepted by Restaurant',
  confirmed: 'Accepted by Restaurant',
  preparing: 'Food is Preparing',
  ready: 'Ready for Pickup',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected by Restaurant',
  declined: 'Rejected by Restaurant',
};

export const ORDER_TIMELINE_STEPS: OrderStatus[] = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
];

export function isTerminalStatus(status: OrderStatus): boolean {
  return ['delivered', 'completed', 'cancelled', 'rejected', 'declined'].includes(status);
}

export function isNegativeStatus(status: OrderStatus): boolean {
  return ['cancelled', 'rejected', 'declined'].includes(status);
}
