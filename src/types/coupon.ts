export type CouponDiscountType = 'percentage' | 'flat';

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: {
    couponId: number;
    code: string;
    title?: string;
    description?: string;
    discountType?: CouponDiscountType;
    discountValue?: number;
    maxDiscount?: number;
    minOrderValue?: number;
  };
  discountAmount: number;
  payableSubtotal?: number;
}

export interface CouponCartPayloadItem {
  item_id: number;
  category_id?: number;
  quantity: number;
  unit_price: number;
}

export interface CouponCartPayload {
  subtotal: number;
  items: CouponCartPayloadItem[];
}

export interface CouponValidationRequest {
  restaurant_id: number;
  coupon_code: string;
  cart: CouponCartPayload;
  customer?: {
    phone?: string;
  };
}

export interface CheckoutCouponState {
  restaurantId: number;
  couponCode?: string;
  source: 'campaign' | 'manual';
  validation?: CouponValidationResult;
  removedCouponCode?: string;
  updatedAt: number;
}
