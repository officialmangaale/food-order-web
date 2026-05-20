import type {
  GroceryCartItem,
  GroceryCartValidateRequest,
  GroceryCartValidateResponse,
  GroceryProduct,
} from '@/types/grocery';

export function toGroceryCartItem(product: GroceryProduct): GroceryCartItem {
  return {
    grocery_product_id: product.id,
    grocery_merchant_id: product.grocery_merchant_id,
    name: product.name,
    brand: product.brand,
    package_size: product.package_size,
    image_url: product.image_url,
    category_name: product.category_name,
    mrp: product.mrp,
    selling_price: product.selling_price,
    quantity: 1,
  };
}

export function buildGroceryCartValidatePayload(params: {
  groceryMerchantId: number;
  items: GroceryCartItem[];
  latitude: number;
  longitude: number;
}): GroceryCartValidateRequest {
  return {
    grocery_merchant_id: params.groceryMerchantId,
    items: params.items.map((item) => ({
      grocery_product_id: item.grocery_product_id,
      quantity: item.quantity,
    })),
    delivery_location: {
      latitude: params.latitude,
      longitude: params.longitude,
    },
  };
}

export function hasNoFulfillmentMessage(value?: string) {
  if (!value) return false;
  return /not available|cannot fulfill|no fulfillment|near your location|too far/i.test(value);
}

export function getGroceryValidationMessage(validation?: GroceryCartValidateResponse | null) {
  if (!validation) return '';

  if (validation.valid === false && hasNoFulfillmentMessage(validation.message)) {
    return 'Some items are not available near your location.';
  }

  if (validation.valid === false) {
    return validation.message || 'Some items need attention before checkout.';
  }

  if (validation.warnings.length > 0) return validation.warnings[0];
  return '';
}
