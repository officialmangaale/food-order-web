import { useCartStore } from '@/store/cartStore';
import type { CartItem } from '@/types/cart';
import type { CategoryFoodItem } from '@/types/category';

export const needsOptions = (item: CategoryFoodItem) => Boolean(
  item.hasVariants || item.hasAddons || item.variants?.length || item.addons?.length,
);

export const sameLine = (a: CartItem, b: CartItem) =>
  a.item_id === b.item_id && a.variant_id === b.variant_id;

const extrasKey = (item: CartItem) => JSON.stringify(item.addons.map((a) =>
  [a.addon_id, a.quantity, a.price]).sort((a, b) => a[0] - b[0]));

/** Respect the existing product/variant cart key. Never let it merge different extras. */
export function saveCategorySelection(selection: CartItem, editing?: CartItem) {
  const cart = useCartStore.getState();
  if (!selection.restaurant_id || cart.isDifferentRestaurant(selection.restaurant_id) ||
    cart.items.some((line) => line.restaurant_id != null && line.restaurant_id !== selection.restaurant_id)) {
    throw new Error('Your cart contains items from another restaurant. Close this panel and add again to review the cart choice.');
  }
  if (editing && !cart.items.includes(editing)) {
    throw new Error('This cart item changed. Close this panel and open Edit again.');
  }
  const collision = cart.items.find((line) => line !== editing && sameLine(line, selection));
  if (collision && (extrasKey(collision) !== extrasKey(selection) ||
    (collision.variant_price ?? collision.base_price) !== (selection.variant_price ?? selection.base_price))) {
    throw new Error('This variant is already in your cart with different selections. Edit that selection, or choose another variant.');
  }
  cart.setRestaurant(selection.restaurant_id, selection.restaurant_name ?? '', selection.restaurant_slug);
  if (editing) cart.removeItem(editing.item_id, editing.variant_id);
  cart.addItem(selection);
}

export function plainSelection(item: CategoryFoodItem): CartItem {
  return {
    restaurant_id: item.restaurantId, restaurant_name: item.restaurantName,
    restaurant_slug: item.restaurantSlug, item_id: item.itemId, name: item.name,
    image_url: item.imageUrl, quantity: 1, base_price: item.price,
    category_id: item.categoryId, category_name: item.categoryName, is_taxable: item.isTaxable, addons: [],
  };
}
