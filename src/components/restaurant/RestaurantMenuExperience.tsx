'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Heart, List, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { VegIndicator } from '@/components/ui/FoodMeta';
import { Sheet } from '@/components/ui/Sheet';
import { CategoryCustomize } from '@/components/category/CategoryCustomize';
import { plainSelection, saveCategorySelection } from '@/components/category/categoryCart';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { useCartStore } from '@/store/cartStore';
import { useHasMounted } from '@/hooks/useHasMounted';
import type { CartItem } from '@/types/cart';
import type { CategoryFoodItem } from '@/types/category';
import type { MenuCategory, MenuItem } from '@/types/menu';
import type { Restaurant } from '@/types/restaurant';
import { formatMoney } from '@/utils/money';
import { buildMenuSections, getMenuCapabilities, hasCustomOptions } from './restaurantMenuModel';
import { RestaurantFullMenu, dietaryValue, menuPrice } from './RestaurantFullMenu';
import { useRestaurantPanels } from './useRestaurantPanels';
import { RestaurantCategoryTabs } from './RestaurantCategoryTabs';
import type { RestaurantMenuFilters } from './restaurantMenuTypes';
import styles from './RestaurantExperience.module.css';

interface Props {
  restaurant: Restaurant; restaurantSlug: string; menu?: MenuCategory[];
  loading: boolean; error: Error | null; onRetry: () => void;
  orderingDisabled: boolean; disabledReason: string; campaignBanner?: ReactNode;
}
const EMPTY_MENU: MenuCategory[] = [];

export function RestaurantMenuExperience(props: Props) {
  const { restaurant, orderingDisabled, disabledReason } = props;
  const mounted = useHasMounted();
  const reduceMotion = useReducedMotion();
  const [favorite, setFavorite] = useState(false);
  const [filters, setFilters] = useState<RestaurantMenuFilters>({ vegOnly: false, bestsellers: false, ratingFourPlus: false });
  const [requestedCategory, setRequestedCategory] = useState('');
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [moving, setMoving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitLock = useRef(false);
  const cleared = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const navigation = useRestaurantPanels();
  const { panels, top } = navigation;
  const cartItems = useCartStore((s) => s.items);
  const cartRestaurantId = useCartStore((s) => s.restaurantId);
  const storedCount = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.estimatedSubtotal());
  const count = mounted ? storedCount : 0;
  const menu = useMemo(() => (props.menu ?? EMPTY_MENU).filter((category) => category.is_active !== false).map((category) => ({
    ...category, items: (category.items ?? []).filter((item) => item.restaurant_id == null || item.restaurant_id === restaurant.id),
  })), [props.menu, restaurant.id]);
  const capabilities = useMemo(() => getMenuCapabilities(menu), [menu]);
  const sections = useMemo(() => buildMenuSections(menu, '', filters, capabilities), [menu, filters, capabilities]);
  const section = sections.find((entry) => entry.key === requestedCategory) ?? sections.find((entry) => entry.items.some((item) => item.is_available !== false)) ?? sections[0];
  const items = section?.items ?? [];
  const position = items.findIndex((item) => item.id === positions[section?.key ?? '']);
  const index = position >= 0 ? position : Math.max(0, items.findIndex((item) => item.is_available !== false));
  const current = items[index];
  const previous = items[index - 1];
  const next = items[index + 1];
  const allItems = menu.flatMap((category) => (category.items ?? []).map((item) => ({
    ...item, category_id: item.category_id ?? category.id, category_name: item.category_name ?? category.name,
  })));
  const panelItem = top && top.kind !== 'menu' ? allItems.find((item) => item.id === top.itemId) : undefined;
  const linesFor = (item: MenuItem) => cartItems.filter((line) => line.item_id === item.id && (line.restaurant_id ?? cartRestaurantId) === restaurant.id);
  const panelLines = panelItem ? linesFor(panelItem) : [];
  const editing = top?.kind === 'customize' && top.edit ? panelLines.find((line) => line.variant_id === top.variantId) : undefined;
  const stalePanel = Boolean(top && top.kind !== 'menu' && (!panelItem || (top.kind === 'customize' && top.edit && !editing)));
  const toCategoryItem = (item: MenuItem): CategoryFoodItem => ({
    itemId: item.id, restaurantId: restaurant.id, restaurantName: restaurant.name, restaurantSlug: props.restaurantSlug,
    name: item.name, description: item.description, imageUrl: item.image_url, price: item.price,
    categoryId: item.category_id, categoryName: item.category_name, isAvailable: item.is_available !== false,
    restaurantIsOpen: !orderingDisabled, isVegetarian: dietaryValue(item), isTaxable: item.is_taxable,
    hasVariants: item.has_variants, hasAddons: item.has_addons, variants: item.variants, addons: item.addons,
  });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timeout);
  }, [notice]);
  const move = (direction: -1 | 1) => {
    if (lock.current || panels.length || !section || (direction > 0 ? !next : !previous)) return;
    lock.current = true; setMoving(true); setError(''); setNotice('');
    setPositions((old) => ({ ...old, [section.key]: items[index + direction].id }));
    timer.current = setTimeout(() => { lock.current = false; setMoving(false); }, reduceMotion ? 0 : 420);
  };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || panels.length) return;
      if (event.target instanceof Element && event.target.closest('button,a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"],[role="slider"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  const addDirect = (item: MenuItem) => {
    if (submitLock.current || orderingDisabled || item.is_available === false) return;
    submitLock.current = true;
    try { saveCategorySelection(plainSelection(toCategoryItem(item))); setError(''); setNotice(`${item.name} added to cart`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not add this dish. Please try again.'); }
    finally { setTimeout(() => { submitLock.current = false; }, 350); }
  };
  const add = (item: MenuItem) => {
    if (orderingDisabled || item.is_available === false) return;
    if (useCartStore.getState().isDifferentRestaurant(restaurant.id)) {
      navigation.open({ kind: 'conflict', itemId: item.id }); return;
    }
    if (hasCustomOptions(item)) navigation.open({ kind: 'customize', itemId: item.id });
    else addDirect(item);
  };
  const quantityChange = (line: CartItem, amount: number) => {
    if (amount > 0 && orderingDisabled) return;
    const cart = useCartStore.getState();
    if (cart.items.includes(line)) cart.updateQuantity(line.item_id, line.quantity + amount, line.variant_id);
  };
  const controls = (item: MenuItem, hero = false) => {
    const lines = linesFor(item);
    const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const disabled = orderingDisabled || item.is_available === false || (hero && moving);
    return <div className={styles.controls}>
      {quantity ? <div className={styles.stepper}>
        <button aria-label={`Decrease quantity of ${item.name}`} onClick={() => lines.length === 1 ? quantityChange(lines[0], -1) : navigation.open({ kind: 'selections', itemId: item.id })}><Minus size={18} /></button>
        <span aria-label={`${quantity} in cart`}>{quantity}</span>
        <button disabled={disabled} aria-label={`Increase quantity of ${item.name}`} onClick={() => add(item)}><Plus size={18} /></button>
      </div> : <button className={hero ? styles.add : styles.rowAdd} disabled={disabled} aria-label={`Add ${item.name}`} onClick={() => add(item)}>
        {hero ? <Plus size={30} /> : <>Add <Plus size={17} /></>}
      </button>}
      {quantity > 0 && hasCustomOptions(item) ? <button className={styles.edit} onClick={() => {
        navigation.open(lines.length === 1 ? { kind: 'customize', itemId: item.id, edit: true, variantId: lines[0].variant_id } : { kind: 'selections', itemId: item.id });
      }}>Edit</button> : hero && !quantity ? <span className={styles.addLabel}>Add</span> : null}
    </div>;
  };
  const transition = { duration: reduceMotion ? 0 : 0.4, ease: [0.22, 0.68, 0, 1] as [number, number, number, number] };
  const preview = (item: MenuItem | undefined, direction: -1 | 1) => <button
    className={`${styles.preview} ${direction > 0 ? styles.next : styles.previous}`} disabled={!item || moving}
    aria-label={item ? `${direction > 0 ? 'Next' : 'Previous'}: ${item.name}` : `No ${direction > 0 ? 'next' : 'previous'} product`}
    onClick={() => move(direction)}>
    {item && <motion.div key={item.id} layoutId={`restaurant-${restaurant.id}-item-${item.id}`} className={styles.previewImage} transition={transition}>
      <Thumbnail key={item.id} src={item.image_url} alt="" ratio="square" className={styles.photo} priority />
    </motion.div>}
    <span><small>{direction > 0 ? 'Next' : 'Previous'} {direction > 0 ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}</small><strong>{item?.name ?? (direction > 0 ? 'Last dish' : 'First dish')}</strong></span>
  </button>;
  const rating = restaurant.average_rating ?? restaurant.rating;
  const ratings = restaurant.total_ratings ?? restaurant.review_count;
  const cuisine = restaurant.cuisine_types?.join(' · ') || restaurant.cuisine || restaurant.category || restaurant.type;
  const delivery = restaurant.estimated_delivery_time ?? restaurant.delivery_time;
  const currentLines = current ? linesFor(current) : [];
  const price = currentLines.length === 1 ? (currentLines[0].variant_price ?? currentLines[0].base_price) + currentLines[0].addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0) : current ? menuPrice(current) : 0;
  const fullMenuOpen = panels.some((panel) => panel.kind === 'menu');

  return <>
    <main id="main-content" className={styles.experience} inert={panels.length > 0} tabIndex={-1} data-restaurant-id={restaurant.id}>
      <div className={styles.browsingHeader}>
      <header className={styles.header}>
        <button className={styles.back} onClick={navigation.back} aria-label="Back"><ArrowLeft size={22} /><span className={styles.backText}>Back</span></button>
        <div className={styles.restaurantInfo}><h1>{restaurant.name}</h1>{cuisine && <p>{cuisine}</p>}
          {(Boolean(rating && rating > 0) || delivery) && <div className={styles.meta}>
            {rating != null && rating > 0 && <span><Star size={14} fill="currentColor" />{rating}{ratings != null && ratings > 0 ? ` (${ratings})` : ''}</span>}
            {delivery && <span>{delivery}</span>}
          </div>}
        </div>
        <button className={styles.favorite} aria-label={favorite ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={favorite} onClick={() => setFavorite((value) => !value)}>
          <Heart size={23} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </header>
      <RestaurantCategoryTabs label="Restaurant categories" entries={sections} activeKey={section?.key}
        disabled={moving} onSelect={(key) => { setRequestedCategory(key); setError(''); }} />
      </div>
      {orderingDisabled && <p className={styles.availability} role="status">{disabledReason}</p>}
      <LayoutGroup id={`restaurant-${restaurant.id}`}>
        {current && !props.error ? <section className={styles.product} aria-label="Current dish"
          onTouchStart={(e) => { if (!(e.target instanceof Element) || !e.target.closest('button,a')) touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchCancel={() => { touch.current = null; }} onTouchEnd={(e) => {
            const start = touch.current; touch.current = null; if (!start) return;
            const dx = e.changedTouches[0].clientX - start.x; const dy = e.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
          }}>
          <div className={styles.productInfo} aria-live="polite" aria-atomic="true"><p className={styles.position}>{index + 1} / {items.length}</p>
            <h2>{current.name}</h2><p className={styles.diet}><VegIndicator vegetarian={dietaryValue(current)} />{dietaryValue(current) == null ? current.food_type : dietaryValue(current) ? 'Veg' : 'Non-veg'}</p>
          </div>
          {preview(next, 1)}
          <div className={styles.stage}><motion.div key={current.id} layoutId={`restaurant-${restaurant.id}-item-${current.id}`} className={styles.heroImage} transition={transition}>
            <Thumbnail key={current.id} src={current.image_url} alt={current.name} ratio="square" className={styles.photo} priority />
          </motion.div></div>
          {preview(previous, -1)}
          <div className={styles.purchase}><div><strong>{formatMoney(price)}</strong><small>{current.is_available === false ? 'Unavailable' : currentLines.length === 1 ? 'Each' : hasCustomOptions(current) ? 'Customisable' : ''}</small></div>{controls(current, true)}</div>
        </section> : <section className={styles.status} role="status">
          {props.loading ? <><div className={styles.skeleton} /><h2>Loading the menu…</h2></> : props.error ? <><h2>Menu unavailable</h2><p>Please try again.</p><button className={styles.primary} onClick={props.onRetry}>Retry menu</button></> : <><h2>No dishes to show</h2><p>{filters.vegOnly || filters.bestsellers || filters.ratingFourPlus ? 'Try clearing your filters in Full menu.' : 'This restaurant has no menu items available yet.'}</p></>}
        </section>}
      </LayoutGroup>
      <button className={styles.fullMenuButton} disabled={props.loading || Boolean(props.error)} onClick={() => navigation.open({ kind: 'menu' })}><List size={20} />Full menu</button>
      <div className={styles.feedback} aria-live="polite">{notice && <span><Check size={15} />{notice}</span>}{error && <p className={styles.error} role="alert">{error}</p>}</div>
      {count > 0 && <Link href="/cart" className={styles.cart}><ShoppingBag size={22} /><span><strong>{count} {count === 1 ? 'item' : 'items'}</strong><small>Item subtotal · {formatMoney(subtotal)}</small></span><strong>View cart</strong><ArrowRight size={18} /></Link>}
    </main>
    {fullMenuOpen && <RestaurantFullMenu restaurantName={restaurant.name} sections={sections} activeCategoryKey={section?.key}
      filters={filters} onFiltersChange={setFilters} capabilities={capabilities} blocked={top?.kind !== 'menu'} onClose={navigation.close}
      onSelect={(item, category) => { setRequestedCategory(category); setPositions((old) => ({ ...old, [category]: item.id })); navigation.close(); }}
      renderControls={(item) => controls(item)} campaignBanner={props.campaignBanner} notice={error || notice} />}
    <Sheet open={stalePanel} onClose={navigation.close} title="Selection unavailable">
      <p>This dish or cart selection has changed. Close this panel to choose again.</p>
    </Sheet>
    {top?.kind === 'customize' && panelItem && !stalePanel && <CategoryCustomize key={`${panelItem.id}:${top.edit}:${top.variantId}`} item={toCategoryItem(panelItem)} editing={editing}
      onClose={navigation.close} onSuccess={() => { setError(''); setNotice(top.edit ? 'Selections updated' : `${panelItem.name} added to cart`); navigation.close(); }} />}
    <Sheet open={top?.kind === 'selections' && !stalePanel} onClose={navigation.close} title="Your selections" description={panelItem?.name}>
      <div className={styles.selectionList}>{panelLines.map((line) => <div key={line.variant_id ?? 'plain'}><strong>{line.variant_name || line.name}</strong>
        <p>{line.addons.map((addon) => `${addon.quantity} × ${addon.name}`).join(', ') || 'No extras'}</p><div className={styles.selectionActions}>
          <button aria-label={`Decrease ${line.variant_name || line.name}`} onClick={() => quantityChange(line, -1)}><Minus size={17} /></button><span>{line.quantity}</span>
          <button disabled={orderingDisabled || panelItem?.is_available === false} aria-label={`Increase ${line.variant_name || line.name}`} onClick={() => quantityChange(line, 1)}><Plus size={17} /></button>
          <button onClick={() => navigation.replace({ kind: 'customize', itemId: line.item_id, edit: true, variantId: line.variant_id })}>Edit</button>
        </div></div>)}</div>
    </Sheet>
    <CartConflictModal open={top?.kind === 'conflict' && !stalePanel} newRestaurantName={restaurant.name} onCleared={() => { cleared.current = true; }} onClose={() => {
      if (cleared.current && panelItem) {
        cleared.current = false;
        if (hasCustomOptions(panelItem)) { navigation.replace({ kind: 'customize', itemId: panelItem.id }); return; }
        addDirect(panelItem);
      }
      navigation.close();
    }} />
  </>;
}
