export type GroceryOrderStatus =
  | 'placed'
  | 'accepted'
  | 'packing'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export interface GroceryMerchant {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string;
  banner_url?: string;
  distance_km?: number;
  distance?: string;
  delivery_time?: string;
  is_open?: boolean;
  delivery_fee?: number;
  tags: string[];
}

export interface GroceryProduct {
  id: number;
  grocery_merchant_id?: number;
  name: string;
  brand?: string;
  package_size?: string;
  image_url?: string;
  category_id?: string;
  category_name?: string;
  mrp?: number;
  selling_price: number;
  is_available: boolean;
}

export interface GroceryProductCategory {
  id: string;
  name: string;
  products: GroceryProduct[];
}

export interface GroceryMerchantProducts {
  merchant: GroceryMerchant | null;
  categories: GroceryProductCategory[];
  products: GroceryProduct[];
}

export interface GroceryCartItem {
  grocery_product_id: number;
  grocery_merchant_id?: number;
  name: string;
  brand?: string;
  package_size?: string;
  image_url?: string;
  category_name?: string;
  mrp?: number;
  selling_price: number;
  quantity: number;
}

export interface GroceryCartTotals {
  subtotal: number;
  delivery_fee: number;
  grand_total: number;
}

export interface GroceryCartValidateRequest {
  grocery_merchant_id: number;
  items: {
    grocery_product_id: number;
    quantity: number;
  }[];
  delivery_location: {
    latitude: number;
    longitude: number;
  };
}

export interface GroceryCartValidateResponse {
  valid: boolean;
  subtotal: number;
  delivery_fee: number;
  grand_total: number;
  warnings: string[];
  message?: string;
  item_errors?: { grocery_product_id?: number; product_id?: number; message: string }[];
}

export interface GroceryPlaceOrderRequest {
  grocery_merchant_id: number;
  customer_name: string;
  customer_phone: string;
  payment_method: 'cash';
  delivery_address: string;
  delivery_landmark?: string;
  delivery_latitude: number;
  delivery_longitude: number;
  notes?: string;
  items: {
    grocery_product_id: number;
    quantity: number;
  }[];
}

export interface GroceryPlaceOrderResponse {
  order_id: number;
  order_number?: string;
  status: GroceryOrderStatus;
  grand_total?: number;
  message?: string;
}

export interface GroceryTrackingItem {
  grocery_product_id?: number;
  name: string;
  brand?: string;
  package_size?: string;
  quantity: number;
  unit_price?: number;
  line_total?: number;
}

export interface GroceryTrackingAddress {
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface GroceryTrackingOrder {
  order_id: number | string;
  order_number?: string;
  display_order_id: string;
  status: GroceryOrderStatus;
  merchant_name: string;
  items: GroceryTrackingItem[];
  subtotal: number;
  delivery_fee: number;
  grand_total: number;
  payment_method: string;
  delivery_address?: GroceryTrackingAddress;
  warnings: string[];
  placed_at?: string;
  accepted_at?: string;
  packing_at?: string;
  packed_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
}

export const GROCERY_TRACKING_STEPS: GroceryOrderStatus[] = [
  'placed',
  'accepted',
  'packing',
  'packed',
  'out_for_delivery',
  'delivered',
];

export const GROCERY_STATUS_LABELS: Record<GroceryOrderStatus, string> = {
  placed: 'Order placed',
  accepted: 'Accepted',
  packing: 'Packing',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};
