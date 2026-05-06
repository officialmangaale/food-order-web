/** Convert restaurant name to URL-safe slug */
export function slugifyRestaurantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Check if identifier looks like a numeric ID */
export function isNumericId(identifier: string): boolean {
  return /^\d+$/.test(identifier);
}
