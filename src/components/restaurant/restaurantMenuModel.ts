import type { MenuCategory, MenuItem } from '@/types/menu';
import type { RestaurantMenuFilters, RestaurantMenuSectionData } from './restaurantMenuTypes';

export function buildMenuSections(
  menu: MenuCategory[],
  query: string,
  filters: RestaurantMenuFilters,
  capabilities: { hasBestsellerData: boolean; hasRatingData: boolean }
): RestaurantMenuSectionData[] {
  const activeCategories = menu.filter((category) => category.is_active !== false);
  const allItems = activeCategories.flatMap((category) =>
    (category.items ?? []).map((item) => withCategoryFallback(item, category))
  );
  const normalizedQuery = query.trim().toLowerCase();
  const applyFilters = (item: MenuItem) =>
    matchesSearch(item, normalizedQuery) &&
    matchesFilters(item, filters, capabilities);

  const recommendedCandidates = allItems.filter(isRecommendedItem);
  const recommendedItems = recommendedCandidates.filter(applyFilters);
  const sections: RestaurantMenuSectionData[] = [];

  if (recommendedItems.length > 0) {
    sections.push({
      key: 'popular',
      title: 'Popular',
      items: recommendedItems,
    });
  }

  for (const category of activeCategories) {
    const items = (category.items ?? [])
      .map((item) => withCategoryFallback(item, category))
      .filter(applyFilters);

    if (items.length === 0) continue;

    sections.push({
      key: String(category.id),
      title: category.name,
      category,
      categoryType: category.category_type,
      items,
    });
  }

  return sections;
}

function withCategoryFallback(item: MenuItem, category: MenuCategory): MenuItem {
  if (item.category_id === category.id && item.category_name) return item;

  return {
    ...item,
    category_id: item.category_id ?? category.id,
    category_name: item.category_name ?? category.name,
  };
}

export function getMenuCapabilities(menu: MenuCategory[]) {
  const items = menu.flatMap((category) => category.items ?? []);
  return {
    hasBestsellerData: items.some((item) => item.is_bestseller != null),
    hasRatingData: items.some((item) => item.rating != null),
  };
}

function matchesSearch(item: MenuItem, query: string) {
  if (!query) return true;
  return [item.name, item.description, item.category_name]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

function matchesFilters(
  item: MenuItem,
  filters: RestaurantMenuFilters,
  capabilities: { hasBestsellerData: boolean; hasRatingData: boolean }
) {
  if (filters.vegOnly && !isVegetarian(item)) return false;
  if (filters.bestsellers && capabilities.hasBestsellerData && item.is_bestseller !== true) return false;
  if (filters.ratingFourPlus && capabilities.hasRatingData && (item.rating ?? 0) < 4) return false;
  return true;
}

export function isVegetarian(item: MenuItem) {
  if (item.is_vegetarian != null) return item.is_vegetarian;
  if (item.is_veg != null) return item.is_veg;
  const foodType = item.food_type?.toLowerCase();
  return foodType === 'veg' || foodType === 'vegetarian';
}

function isRecommendedItem(item: MenuItem) {
  return item.is_recommended === true || item.is_popular === true || item.is_bestseller === true;
}

export function hasCustomOptions(item: MenuItem) {
  return (
    item.has_variants ||
    item.has_addons ||
    (item.variants?.length ?? 0) > 0 ||
    (item.addons?.length ?? 0) > 0
  );
}
