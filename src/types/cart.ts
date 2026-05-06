export interface CartAddon {
  addon_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  item_id: number;
  name: string;
  image_url?: string;
  quantity: number;
  variant_id?: number;
  variant_name?: string;
  variant_price?: number;
  base_price: number;
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
  customer_location: {
    latitude: number;
    longitude: number;
  };
  items: CartValidateRequestItem[];
}

export interface CartValidateResponse {
  valid: boolean;
  subtotal?: number;
  taxes?: number;
  delivery_fee?: number;
  discount?: number;
  total?: number;
  message?: string;
  item_errors?: { item_id: number; message: string }[];
}

/** Shape of validated totals stored in the cart store */
export interface ValidatedTotals {
  subtotal: number;
  taxes: number;
  delivery_fee: number;
  discount: number;
  total: number;
}
