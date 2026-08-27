'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VegIndicator } from '@/components/ui/FoodMeta';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Sheet } from '@/components/ui/Sheet';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { formatMoney } from '@/utils/money';
import { useCartStore } from '@/store/cartStore';
import type { MenuItem } from '@/types/menu';

interface Props {
  item: MenuItem | null;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  onClose: () => void;
}

export function ItemCustomizeModal({
  item,
  restaurantId,
  restaurantName,
  restaurantSlug,
  onClose,
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});
  const [qty, setQty] = useState(1);
  const [lastItemId, setLastItemId] = useState<number | undefined>(undefined);
  const addItem = useCartStore((s) => s.addItem);
  const setRestaurant = useCartStore((s) => s.setRestaurant);

  // Reset the form when a different item opens the sheet. Adjusting state
  // during render (rather than in an effect) avoids a second render pass.
  if (item && item.id !== lastItemId) {
    setLastItemId(item.id);
    setSelectedVariant(item.variants?.[0]?.id ?? undefined);
    setSelectedAddons({});
    setQty(1);
  }

  const variant = item?.variants?.find((v) => v.id === selectedVariant);
  const basePrice = variant?.price ?? item?.price ?? 0;
  const addonTotal = Object.entries(selectedAddons).reduce((sum, [id, q]) => {
    const a = item?.addons?.find((ad) => ad.id === Number(id));
    return sum + (a?.price ?? 0) * q;
  }, 0);
  const total = (basePrice + addonTotal) * qty;
  const vegetarian = item?.is_veg ?? item?.is_vegetarian;

  const toggleAddon = (id: number) => {
    setSelectedAddons((prev) => {
      const cur = prev[id] ?? 0;
      if (cur > 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const handleAdd = () => {
    if (!item) return;

    setRestaurant(restaurantId, restaurantName, restaurantSlug);
    addItem({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      restaurant_slug: restaurantSlug,
      item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      quantity: qty,
      variant_id: selectedVariant,
      variant_name: variant?.name,
      variant_price: variant?.price,
      base_price: item.price,
      category_id: item.category_id,
      category_name: item.category_name,
      is_taxable: item.is_taxable,
      addons: Object.entries(selectedAddons).map(([id, q]) => {
        const a = item.addons?.find((ad) => ad.id === Number(id));
        return { addon_id: Number(id), name: a?.name ?? '', price: a?.price ?? 0, quantity: q };
      }),
    });
    onClose();
  };

  const availableVariants = item?.variants?.filter((v) => v.is_available !== false) ?? [];
  const availableAddons = item?.addons?.filter((a) => a.is_available !== false) ?? [];

  return (
    <Sheet
      open={Boolean(item)}
      onClose={onClose}
      title={item?.name}
      size="lg"
      footer={
        <div className="flex items-center gap-3">
          <QuantityStepper
            quantity={qty}
            onIncrease={() => setQty(qty + 1)}
            onDecrease={() => setQty(Math.max(1, qty - 1))}
            itemName={item?.name ?? 'item'}
            size="md"
          />
          <Button size="lg" className="min-w-0 flex-1" onClick={handleAdd}>
            <span className="truncate">Add to cart · {formatMoney(total)}</span>
          </Button>
        </div>
      }
    >
      {item && (
        <div className="space-y-6">
          <Thumbnail
            src={item.image_url}
            alt={item.name}
            ratio="wide"
            className="rounded-card"
          />

          <div>
            <div className="flex items-center gap-2">
              <VegIndicator vegetarian={vegetarian} />
              <p className="text-sm font-semibold text-ink-muted">
                {vegetarian == null ? '' : vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
              </p>
            </div>
            <p className="mt-2 text-section text-ink">{formatMoney(item.price)}</p>
            {item.description && (
              <p className="mt-3 text-sm leading-6 text-ink-muted">{item.description}</p>
            )}
          </div>

          {availableVariants.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-extrabold text-ink">Choose a variant</legend>
              <div className="divide-y divide-line rounded-card border border-line">
                {availableVariants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                      selectedVariant === v.id ? 'bg-brand-50' : 'hover:bg-surface-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant === v.id}
                      onChange={() => setSelectedVariant(v.id)}
                      className="h-5 w-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{v.name}</span>
                    <span className="shrink-0 text-sm font-bold text-ink">
                      {v.price === item.price ? 'Included' : formatMoney(v.price)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {availableAddons.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-extrabold text-ink">Add extras</legend>
              <div className="divide-y divide-line rounded-card border border-line">
                {availableAddons.map((a) => (
                  <label
                    key={a.id}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                      (selectedAddons[a.id] ?? 0) > 0 ? 'bg-brand-50' : 'hover:bg-surface-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(selectedAddons[a.id] ?? 0) > 0}
                      onChange={() => toggleAddon(a.id)}
                      className="h-5 w-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{a.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-ink-muted">
                      +{formatMoney(a.price)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
    </Sheet>
  );
}
