'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { Sheet } from '@/components/ui/Sheet';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { VegIndicator } from '@/components/ui/FoodMeta';
import { useCartStore } from '@/store/cartStore';
import { useHasMounted } from '@/hooks/useHasMounted';
import type { CartItem } from '@/types/cart';
import type { CategoryFoodItem } from '@/types/category';
import { formatMoney } from '@/utils/money';
import { CategoryCustomize } from './CategoryCustomize';
import { needsOptions, plainSelection, saveCategorySelection } from './categoryCart';
import { useBrowseItems } from './useBrowseItems';
import styles from './CategoryBrowser.module.css';

interface Props {
  categoryKey: string; initialName?: string;
  lat: number | null; lng: number | null; radiusKm: number;
}

export function CategoryBrowser(props: Props) {
  const mounted = useHasMounted();
  const feed = useBrowseItems(props);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitting = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [customize, setCustomize] = useState<{ item: CategoryFoodItem; editing?: CartItem } | null>(null);
  const [manage, setManage] = useState(false);
  const [conflict, setConflict] = useState<CategoryFoodItem | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const cartItems = useCartStore((s) => s.items);
  const storedCount = useCartStore((s) => s.totalItems());
  const count = mounted ? storedCount : 0;
  const subtotal = useCartStore((s) => s.estimatedSubtotal());
  const currentIndex = Math.min(index, Math.max(0, feed.items.length - 1));
  const item = feed.items[currentIndex];
  const previous = feed.items[currentIndex - 1];
  const next = feed.items[currentIndex + 1];
  const name = feed.name || props.initialName || props.categoryKey.replace(/[-_]/g, ' ');
  const lines = cartItems.filter((line) => line.item_id === item?.itemId &&
    (line.restaurant_id ?? useCartStore.getState().restaurantId) === item?.restaurantId);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const availablePrices = item?.variants?.filter((v) => v.is_available !== false).map((v) => v.price) ?? [];
  const displayPrice = lines.length === 1
    ? (lines[0].variant_price ?? lines[0].base_price) + lines[0].addons.reduce((sum, a) => sum + a.price * a.quantity, 0)
    : availablePrices.length ? Math.min(...availablePrices) : item?.price ?? 0;
  const unavailable = item && (!item.isAvailable || item.restaurantIsOpen === false);
  const modalOpen = Boolean(customize || manage || conflict);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('mangaale-category-entry') === window.location.pathname + window.location.search) {
        window.history.replaceState({ ...window.history.state, mangaaleCategoryBack: true }, '');
        sessionStorage.removeItem('mangaale-category-entry');
      }
    } catch { /* Direct URLs still have a safe home fallback. */ }
    // The fullscreen route covers existing chrome and removes it from keyboard navigation.
    // Restore every property on exit; no shared screen or stylesheet is changed.
    const element = root.current;
    const inert = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
    const hideChrome = () => {
      for (const node of Array.from(element?.parentElement?.children ?? [])) {
        if (!(node instanceof HTMLElement) || node === element ||
          ['SCRIPT', 'STYLE', 'LINK', 'NEXTJS-PORTAL'].includes(node.tagName) || inert.has(node)) continue;
        inert.set(node, { inert: node.inert, ariaHidden: node.getAttribute('aria-hidden') });
        node.inert = true;
        node.setAttribute('aria-hidden', 'true');
      }
    };
    hideChrome();
    // Cart chrome can mount after the first addition, while this route stays open.
    const observer = new MutationObserver(hideChrome);
    if (element?.parentElement) observer.observe(element.parentElement, { childList: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      observer.disconnect();
      inert.forEach((value, node) => {
        node.inert = value.inert;
        if (value.ariaHidden == null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', value.ariaHidden);
      });
      document.body.style.overflow = overflow;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 2400);
    return () => clearTimeout(timeout);
  }, [notice]);

  const navigate = (direction: -1 | 1) => {
    if (lock.current || modalOpen || (direction < 0 ? !previous : !next)) return;
    lock.current = true;
    setMoving(true);
    const destination = currentIndex + direction;
    setIndex(destination);
    setError('');
    setNotice('');
    // Only user navigation near the loaded boundary requests another existing API page.
    if (direction > 0 && destination >= feed.items.length - 2) feed.loadMore();
    timer.current = setTimeout(() => { lock.current = false; setMoving(false); }, reduceMotion ? 0 : 420);
  };

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || modalOpen) return;
      const target = event.target;
      if (target instanceof Element && target.closest('button,a,input,textarea,select,[contenteditable="true"],[role="dialog"],[role="slider"],[role="combobox"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  const add = (product: CategoryFoodItem) => {
    if (submitting.current || !product.isAvailable || product.restaurantIsOpen === false) return;
    if (useCartStore.getState().isDifferentRestaurant(product.restaurantId)) { setConflict(product); return; }
    if (needsOptions(product)) { setCustomize({ item: product }); return; }
    submitting.current = true;
    try {
      saveCategorySelection(plainSelection(product));
      setError(''); setNotice(`${product.name} added to cart`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add this item. Please try again.'); }
    finally { setTimeout(() => { submitting.current = false; }, 350); }
  };

  const changeQuantity = (line: CartItem, amount: number) => {
    const cart = useCartStore.getState();
    if (cart.items.includes(line)) cart.updateQuantity(line.item_id, line.quantity + amount, line.variant_id);
  };
  const preview = (product: CategoryFoodItem | undefined, direction: -1 | 1) => (
    <button type="button" className={`${styles.preview} ${direction > 0 ? styles.next : styles.previous}`}
      disabled={!product || moving} onClick={() => navigate(direction)}
      aria-label={product ? `${direction > 0 ? 'Next' : 'Previous'}: ${product.name}` : `No ${direction > 0 ? 'next' : 'previous'} product`}>
      {product && <motion.div key={`${product.restaurantId}:${product.itemId}`} layoutId={`dish-${product.restaurantId}-${product.itemId}`} className={styles.previewImage}
        transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 0.68, 0, 1] }}>
        <Thumbnail key={product.imageUrl ?? product.itemId} src={product.imageUrl} alt="" ratio="square" className={styles.photo} priority />
      </motion.div>}
      <span className={styles.previewText}><span className={styles.eyebrow}>{direction > 0 ? 'Up next' : 'Previous'}</span>
        <strong>{product?.name ?? (direction > 0 ? 'Last dish' : 'First dish')}</strong></span>
      {direction > 0 ? <ArrowRight size={20} aria-hidden /> : <ArrowLeft size={20} aria-hidden />}
    </button>
  );

  return <div ref={root} className={styles.screen} data-category-screen>
    <main id="main-content" className={styles.browser} data-has-cart={count > 0}
      data-tone={item?.isVegetarian === true ? 'herb' : /dessert|sweet|ice|shake/i.test(item?.categoryName ?? name) ? 'sweet' : 'warm'}
      tabIndex={-1} inert={modalOpen}>
      <LayoutGroup id="category-dishes">
        <header className={styles.header}>
          <button className={styles.back} type="button" onClick={() => {
            if (window.history.state?.mangaaleCategoryBack) router.back(); else router.replace('/');
          }}><ArrowLeft size={20} aria-hidden /><span>Back</span></button>
          <span className={styles.categoryName}>{name}</span>
        </header>
        {next ? preview(next, 1) : feed.hasMore || feed.loadingMore || (feed.error && item) ?
          <button className={`${styles.preview} ${styles.next}`} disabled={feed.loadingMore}
            onClick={() => feed.error ? feed.retry() : feed.loadMore()}>
            <span>{feed.loadingMore ? 'Loading next dishes…' : feed.error ? 'Retry next dishes' : 'Load next dishes'}</span><ArrowRight size={20} />
          </button> : preview(undefined, 1)}

        {item ? <>
          <div className={styles.stage} onTouchStart={(e) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={(e) => {
              const start = swipe.current; swipe.current = null;
              if (!start) return;
              const dx = e.changedTouches[0].clientX - start.x;
              const dy = e.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) navigate(dx < 0 ? 1 : -1);
            }} onTouchCancel={() => { swipe.current = null; }}>
            <motion.div key={`${item.restaurantId}:${item.itemId}`} layoutId={`dish-${item.restaurantId}-${item.itemId}`} className={styles.heroImage}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 0.68, 0, 1] }}>
              <Thumbnail key={`${item.restaurantId}:${item.itemId}`} src={item.imageUrl} alt={item.name} ratio="square"
                className={styles.photo} imageClassName={styles.heroPhoto} priority />
            </motion.div>
          </div>
          <section className={styles.info} aria-live="polite" aria-atomic="true">
            <p className={styles.diet}><VegIndicator vegetarian={item.isVegetarian} />
              {item.isVegetarian == null ? item.foodType : item.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}</p>
            <h1>{item.name}</h1><p className={styles.merchant}>{item.restaurantName}</p>
            {item.description && <p className={styles.description}>{item.description}</p>}
            {unavailable && <p className={styles.error}>{item.restaurantIsOpen === false ? 'Restaurant is currently closed' : 'This dish is currently unavailable'}</p>}
          </section>
          {preview(previous, -1)}
          <div className={styles.purchase}>
            <div><span className={styles.eyebrow}>{lines.length === 1 ? 'Each' : needsOptions(item) ? 'From' : 'Price'}</span><strong className={styles.price}>{formatMoney(displayPrice)}</strong></div>
            {quantity > 0 ? <div className={styles.addedControls}>
              <div className={styles.stepper}>
                <button aria-label={`Decrease quantity of ${item.name}`} onClick={() => lines.length === 1 ? changeQuantity(lines[0], -1) : setManage(true)}><Minus size={18} /></button>
                <span aria-label={`${quantity} in cart`}>{quantity}</span>
                <button aria-label={`Increase quantity of ${item.name}`} disabled={unavailable || moving} onClick={() => add(item)}><Plus size={18} /></button>
              </div>
              {needsOptions(item) && <button className={styles.edit} onClick={() => lines.length === 1 ? setCustomize({ item, editing: lines[0] }) : setManage(true)}>Edit selections</button>}
            </div> : <button className={styles.add} disabled={unavailable || moving} aria-label={`Add ${item.name}`} onClick={() => add(item)}><Plus size={30} aria-hidden /></button>}
          </div>
          <div className={styles.position}>{feed.total != null && <span>{currentIndex + 1} / {feed.total}</span>}<span className={styles.navigationHint}>Swipe or use the arrows</span></div>
        </> : <div className={styles.state} role="status">
          {feed.loading ? <><div className={styles.skeleton} /><h1>Finding your next favourite…</h1></> : feed.error ?
            <><h1>Couldn’t load these dishes</h1><p>{feed.error.message}</p><button onClick={() => feed.retry()}>Try again</button></> :
            <><ShoppingBag size={36} /><h1>No dishes available</h1><p>There are no available dishes in this category for your location.</p>{feed.hasMore && <button onClick={feed.loadMore}>Load more dishes</button>}</>}
        </div>}
      </LayoutGroup>
      <div className={styles.feedback} aria-live="polite">{notice && <span><Check size={16} />{notice}</span>}{error && <p role="alert" className={styles.error}>{error}</p>}</div>
      {count > 0 && <Link className={styles.cart} href="/cart"><ShoppingBag size={22} aria-hidden />
        <span><strong>{count} {count === 1 ? 'item' : 'items'}</strong><small>Item subtotal · {formatMoney(subtotal)}</small></span><strong>View cart</strong><ArrowRight size={20} aria-hidden /></Link>}
    </main>
    {customize && <CategoryCustomize item={customize.item} editing={customize.editing}
      onClose={() => setCustomize(null)} onSuccess={() => { setNotice(customize.editing ? 'Selections updated' : `${customize.item.name} added to cart`); setCustomize(null); }} />}
    <Sheet open={manage} onClose={() => setManage(false)} title="Your selections">
      <div className={styles.lineList}>{lines.map((line) => <div key={line.variant_id ?? 'plain'}>
        <strong>{line.variant_name || line.name}</strong><p>{line.addons.map((a) => `${a.quantity} × ${a.name}`).join(', ') || 'No extras'}</p>
        <div className={styles.lineActions}><button onClick={() => changeQuantity(line, -1)} aria-label={`Decrease ${line.variant_name || line.name}`}><Minus size={18} /></button><span>{line.quantity}</span>
          <button onClick={() => changeQuantity(line, 1)} disabled={unavailable} aria-label={`Increase ${line.variant_name || line.name}`}><Plus size={18} /></button>
          <button onClick={() => { setManage(false); setCustomize({ item, editing: line }); }}>Edit</button></div>
      </div>)}</div>
    </Sheet>
    <CartConflictModal open={Boolean(conflict)} newRestaurantName={conflict?.restaurantName ?? ''} onClose={() => setConflict(null)}
      onCleared={() => { if (conflict) add(conflict); }} />
  </div>;
}
