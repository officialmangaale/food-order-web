'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { VegIndicator } from '@/components/ui/FoodMeta';
import { RestaurantFilterChips } from './RestaurantFilterChips';
import { RestaurantCategoryTabs } from './RestaurantCategoryTabs';
import { hasCustomOptions } from './restaurantMenuModel';
import type { MenuItem } from '@/types/menu';
import type { RestaurantMenuFilters, RestaurantMenuSectionData } from './restaurantMenuTypes';
import { formatMoney } from '@/utils/money';
import styles from './RestaurantExperience.module.css';

export function menuPrice(item: MenuItem) {
  const prices = item.variants?.filter((v) => v.is_available !== false).map((v) => v.price) ?? [];
  return prices.length ? Math.min(...prices) : item.price;
}

export function dietaryValue(item: MenuItem) {
  if (item.is_vegetarian != null || item.is_veg != null) return item.is_vegetarian ?? item.is_veg;
  const value = item.food_type?.toLowerCase();
  return value === 'veg' || value === 'vegetarian' ? true : value === 'non-veg' || value === 'non_veg' || value === 'non-vegetarian' ? false : undefined;
}

interface Props {
  restaurantName: string; sections: RestaurantMenuSectionData[];
  activeCategoryKey?: string; filters: RestaurantMenuFilters;
  onFiltersChange: (value: RestaurantMenuFilters) => void;
  capabilities: { hasBestsellerData: boolean; hasRatingData: boolean };
  onClose: () => void; onSelect: (item: MenuItem, category: string) => void;
  renderControls: (item: MenuItem) => ReactNode;
  blocked: boolean; campaignBanner?: ReactNode; notice: string;
}

export function RestaurantFullMenu(props: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(props.activeCategoryKey);
  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const real = props.sections.filter((section) => section.key !== 'popular');
    if (!query) return real;
    return real.map((section) => ({ ...section, items: section.items.filter((item) =>
      [item.name, item.description, item.category_name].some((text) => text?.toLowerCase().includes(query)))
    })).filter((section) => section.items.length > 0);
  }, [props.sections, search]);
  const visible = search.trim() ? sections : sections.filter((section) => section.key === selected);
  const shown = visible.length ? visible : search.trim() ? [] : sections.slice(0, 1);
  return <div inert={props.blocked} aria-hidden={props.blocked || undefined}>
    <Sheet open onClose={props.onClose} title="Full menu" description={props.restaurantName}
      className={styles.menuPanel} size="lg">
      <div className={styles.menuTools}>
        <label className={styles.menuSearch}>
          <Search size={20} aria-hidden /><span className="sr-only">Search this restaurant’s menu</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${props.restaurantName}’s menu`} />
          {search && <button type="button" aria-label="Clear menu search" onClick={() => setSearch('')}><X size={18} /></button>}
        </label>
        <div className={styles.filterScroll}><RestaurantFilterChips filters={props.filters} onChange={props.onFiltersChange} {...props.capabilities} /></div>
        {!search.trim() && <RestaurantCategoryTabs label="Full menu categories" entries={sections}
          activeKey={shown[0]?.key} onSelect={setSelected} />}
      </div>
      {props.campaignBanner}
      <p className={styles.menuNotice} role="status">{props.notice}</p>
      {shown.length === 0 && <div className={styles.emptyList}><h3>No matching dishes</h3><p>Try another search or clear the filters.</p></div>}
      {shown.map((section) => <section key={section.key} aria-label={section.title}>
        <h3 className={styles.menuHeading}>{section.title}</h3>
        {section.items.map((item) => <article className={styles.menuRow} key={item.id} data-menu-item={item.id}>
          <div className={styles.rowInfo}>
            <button className={styles.rowName} onClick={() => props.onSelect(item, section.key)}>{item.name}<VegIndicator vegetarian={dietaryValue(item)} /></button>
            {item.description && <p className={styles.rowDescription}>{item.description}</p>}
            <strong>{formatMoney(menuPrice(item))}</strong>
            {hasCustomOptions(item) && <small>Customisable</small>}
            {item.is_available === false && <small className={styles.error}>Currently unavailable</small>}
          </div>
          <button className={styles.rowImage} aria-label={`View ${item.name}`} onClick={() => props.onSelect(item, section.key)}>
            <Thumbnail src={item.image_url} alt="" ratio="square" className={styles.photo} />
          </button>
          <div className={styles.rowControls}>{props.renderControls(item)}</div>
        </article>)}
      </section>)}
    </Sheet>
  </div>;
}
