/** Generate idempotency key for order placement */
export function generateIdempotencyKey(restaurantId: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `customer-web-${restaurantId}-${timestamp}-${random}`;
}
