import type { CouponValidationResult } from '@/types/coupon';

export interface CartAddon {
  addon_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant_slug?: string;
  item_id: number;
  name: string;
  image_url?: string;
  quantity: number;
  variant_id?: number;
  variant_name?: string;
  variant_price?: number;
  base_price: number;
  category_id?: number;
  category_name?: string;
  is_taxable?: boolean;
  addons: CartAddon[];
}

export interface CartRestaurant {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug?: string;
}

/** Shape sent to the backend cart validate API */
export interface CartValidateRequestItem {
  item_id: number;
  quantity: number;
  variant_id?: number;
  addons?: { addon_id: number; quantity: number }[];
}

export interface CartValidateRequest {
  restaurant_id: number;
  coupon_code?: string;
  customer_location?: {
    latitude: number;
    longitude: number;
  };
  items: CartValidateRequestItem[];
  payment_method?: 'cash';
}

export interface CartValidateResponse {
  valid: boolean;
  billing_snapshot_complete?: boolean;
  billing_snapshot_missing_fields?: string[];
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  tax_amount?: number;
  taxes?: number;
  platform_fee?: number;
  platform_fee_amount?: number;
  delivery_charge?: number;
  delivery_fee?: number;
  extra_charges?: number;
  discount_amount?: number;
  offer_discount_amount?: number;
  discount?: number;
  coupon_validation?: CouponValidationResult;
  exact_total_amount?: number;
  round_off_amount?: number;
  grand_total?: number;
  total?: number;
  message?: string;
  item_errors?: { item_id: number; message: string }[];
}

/** Shape of validated totals stored in the cart store */
export interface ValidatedTotals {
  snapshot_complete: boolean;
  missing_fields: string[];
  subtotal: number;
  cgst: number;
  sgst: number;
  tax_amount: number;
  taxes: number;
  platform_fee: number;
  platform_fee_amount: number;
  delivery_fee: number;
  extra_charges: number;
  discount: number;
  discount_amount: number;
  offer_discount_amount: number;
  round_off_amount: number;
  exact_total_amount: number;
  grand_total: number;
  total: number;
}
