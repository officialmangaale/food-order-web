'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { fetchRestaurantMenu } from '@/services/restaurantApi';
import { categoryItemToMenuItem } from '@/utils/categoryAdapter';
import { formatMoney } from '@/utils/money';
import type { CategoryFoodItem } from '@/types/category';
import type { CartItem } from '@/types/cart';
import type { MenuItem } from '@/types/menu';
import { plainSelection, saveCategorySelection } from './categoryCart';
import styles from './CategoryBrowser.module.css';

interface Props {
  item: CategoryFoodItem;
  editing?: CartItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryCustomize(props: Props) {
  const { item } = props;
  const missingOptions = Boolean((item.hasVariants && !item.variants?.length) || (item.hasAddons && !item.addons?.length));
  const query = useQuery({
    queryKey: ['menu', String(item.restaurantId)],
    queryFn: () => fetchRestaurantMenu(item.restaurantId),
    enabled: missingOptions,
    staleTime: 60_000,
  });
  const menuItem = missingOptions ? query.data?.flatMap((category) => category.items ?? []).find((entry) => entry.id === item.itemId) : categoryItemToMenuItem(item);
  if (!menuItem) return <Sheet open onClose={props.onClose} title={item.name}>
    <div className={styles.panelState} role="status">
      {query.isPending ? 'Loading available options…' : <><p>{query.error ? 'Could not load options. Please try again.' : 'This dish is no longer available on the menu.'}</p>
        <button onClick={() => query.refetch()}>Retry options</button></>}
    </div>
  </Sheet>;
  return <CustomizeForm {...props} menuItem={menuItem} />;
}

function CustomizeForm({ item, menuItem, editing, onClose, onSuccess }: Props & { menuItem: MenuItem }) {
  const [variantId, setVariantId] = useState<number | undefined>(editing?.variant_id);
  const [extras, setExtras] = useState<Record<number, number>>(() => Object.fromEntries(editing?.addons.map((a) => [a.addon_id, a.quantity]) ?? []));
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const variants = menuItem.variants?.filter((v) => v.is_available !== false) ?? [];
  const addons = menuItem.addons?.filter((a) => a.is_available !== false && a.max_quantity !== 0) ?? [];
  const variantRequired = Boolean(item.hasVariants || menuItem.has_variants || menuItem.variants?.length);
  const variant = variants.find((v) => v.id === variantId);
  const invalidExtras = Object.entries(extras).some(([id, qty]) => qty > 0 && !addons.some((a) => a.id === Number(id) && qty <= (a.max_quantity ?? 1)));
  const unavailable = !item.isAvailable || item.restaurantIsOpen === false || menuItem.is_available === false || (variantRequired && variants.length === 0);
  const missingExtras = Boolean((item.hasAddons || menuItem.has_addons) && !menuItem.addons?.length);
  const valid = !unavailable && !missingExtras && (!variantRequired || Boolean(variant)) && !invalidExtras;
  const addonPrice = (addon: (typeof addons)[number]) =>
    addon.price_by_variant?.find((price) => price.variant_id === variant?.id)?.price ?? addon.price;
  const total = ((variant?.price ?? menuItem.price) + addons.reduce((sum, a) => sum + addonPrice(a) * (extras[a.id] ?? 0), 0)) * quantity;
  const confirm = () => {
    if (submitting.current || !valid) return;
    submitting.current = true; setPending(true); setError('');
    try {
      saveCategorySelection({ ...plainSelection(item), base_price: menuItem.price, quantity,
        variant_id: variant?.id, variant_name: variant?.name, variant_price: variant?.price,
        addons: addons.filter((a) => (extras[a.id] ?? 0) > 0).map((a) => ({
          addon_id: a.id, name: a.name, price: addonPrice(a), quantity: extras[a.id],
        })),
      }, editing);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your selection. Please try again.');
      submitting.current = false; setPending(false);
    }
  };
  return <Sheet open onClose={onClose} title={editing ? `Edit ${item.name}` : item.name}
    description={item.restaurantName} size="lg" className={styles.customSheet}
    footer={<div className={styles.confirmArea}>
      <div className={styles.quantityRow}><span>Quantity</span><div className={styles.panelStepper}>
        <button disabled={quantity <= 1 || pending} aria-label="Decrease item quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={18} /></button>
        <strong aria-live="polite">{quantity}</strong><button disabled={pending} aria-label="Increase item quantity" onClick={() => setQuantity((q) => q + 1)}><Plus size={18} /></button>
      </div></div>
      {variantRequired && !variant && !unavailable && <p className={styles.requirement}>Choose a size or variant to continue.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button className={styles.confirm} disabled={!valid || pending} onClick={confirm}>
        <span>{pending ? 'Saving…' : editing ? 'Save changes' : 'Add to cart'}</span><strong>{formatMoney(total)}</strong>
      </button>
    </div>}>
    <div className={styles.customContent}>
      <div className={styles.customIntro}><Thumbnail src={item.imageUrl} alt={item.name} ratio="square" className={styles.customImage} priority />
        <div><span className={styles.eyebrow}>Make it yours</span><p>{item.description || 'Choose your favourite combination.'}</p></div></div>
      {unavailable && <p role="alert" className={styles.error}>This dish or its required variants are currently unavailable.</p>}
      {missingExtras && <p role="alert" className={styles.error}>Option details are currently unavailable. Please close and try again.</p>}
      {invalidExtras && <p role="alert" className={styles.error}>Some saved extras are no longer available. <button onClick={() => setExtras({})}>Reset extras</button></p>}
      {variantRequired && <fieldset className={styles.options}><legend>Choose a size or variant <small>Required · choose one</small></legend>
        {variants.map((v) => <label key={v.id} className={styles.option}>
          <input type="radio" name="category-variant" checked={variantId === v.id} onChange={() => setVariantId(v.id)} disabled={pending} />
          <span>{v.name}</span><strong>{formatMoney(v.price)}</strong>
        </label>)}
      </fieldset>}
      {addons.length > 0 && <fieldset className={styles.options}><legend>Something extra? <small>Optional · charged per item</small></legend>
        {addons.map((addon) => <div className={styles.option} key={addon.id}>
          <label className={styles.addonLabel}><input type="checkbox" checked={(extras[addon.id] ?? 0) > 0} disabled={pending}
            onChange={(e) => setExtras((old) => ({ ...old, [addon.id]: e.target.checked ? 1 : 0 }))} /><span>{addon.name}</span></label>
          <strong>+{formatMoney(addonPrice(addon))}</strong>
          {(addon.max_quantity ?? 1) > 1 && (extras[addon.id] ?? 0) > 0 && <div className={styles.panelStepper}>
            <button disabled={pending} aria-label={`Less ${addon.name}`} onClick={() => setExtras((old) => ({ ...old, [addon.id]: Math.max(0, old[addon.id] - 1) }))}><Minus size={16} /></button>
            <span>{extras[addon.id]}</span><button disabled={pending || extras[addon.id] >= addon.max_quantity!} aria-label={`More ${addon.name}`}
              onClick={() => setExtras((old) => ({ ...old, [addon.id]: old[addon.id] + 1 }))}><Plus size={16} /></button>
          </div>}
        </div>)}
      </fieldset>}
    </div>
  </Sheet>;
}
