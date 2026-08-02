'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Leaf } from 'lucide-react';
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

export function ItemCustomizeModal({ item, restaurantId, restaurantName, restaurantSlug, onClose }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(item?.variants?.[0]?.id ?? undefined);
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});
  const [qty, setQty] = useState(1);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setRestaurant = useCartStore((s) => s.setRestaurant);

  if (!item) return null;

  const variant = item.variants?.find((v) => v.id === selectedVariant);
  const basePrice = variant?.price ?? item.price;
  const addonTotal = Object.entries(selectedAddons).reduce((sum, [id, q]) => {
    const a = item.addons?.find((ad) => ad.id === Number(id));
    return sum + (a?.price ?? 0) * q;
  }, 0);
  const total = (basePrice + addonTotal) * qty;
  const vegetarian = item.is_veg ?? item.is_vegetarian;

  const toggleAddon = (id: number) => {
    setSelectedAddons((prev) => {
      const cur = prev[id] ?? 0;
      if (cur > 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: 1 };
    });
  };

  const handleAdd = () => {
    setRestaurant(restaurantId, restaurantName, restaurantSlug);
    addItem({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      restaurant_slug: restaurantSlug,
      item_id: item.id, name: item.name, image_url: item.image_url, quantity: qty,
      variant_id: selectedVariant, variant_name: variant?.name, variant_price: variant?.price,
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

  return (
    <AnimatePresence>
      <motion.div
        key="customize-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        key="customize-dialog"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-item-title"
        className="fixed inset-0 z-[71] mx-auto h-[100dvh] w-full max-w-none overflow-y-auto bg-[#F7F8FA] shadow-2xl sm:inset-x-0 sm:bottom-auto sm:top-1/2 sm:h-auto sm:max-h-[92vh] sm:w-[min(92vw,620px)] sm:-translate-y-1/2 sm:rounded-[30px] sm:border sm:border-[#E3E7EA]"
      >
        {/* Header image */}
        <div className="relative h-[38svh] min-h-[260px] overflow-hidden bg-[#E8F8F5] sm:h-[300px] sm:min-h-0 sm:rounded-t-[30px]">
          {item.image_url && failedImageUrl !== item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setFailedImageUrl(item.image_url ?? null)}
            />
          ) : (
            <div className="food-placeholder flex h-full w-full items-center justify-center">
              <Leaf className="h-12 w-12 text-white/70" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#172033] shadow-md backdrop-blur transition hover:bg-white focus-visible:ring-4 focus-visible:ring-[#16B8A6]/25 sm:h-11 sm:w-11"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-7 px-3.5 pb-28 pt-6 sm:px-7 sm:pb-7">
          <div>
            {vegetarian != null && (
              <p className="mb-3 flex items-center gap-2.5 text-xs font-bold text-[#172033] sm:text-sm">
                <span className={`h-3 w-3 rounded-full ${vegetarian ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} aria-hidden="true" />
                {vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
              </p>
            )}
            <h2 id="customize-item-title" className="text-lg font-extrabold leading-tight tracking-[-0.035em] text-[#172033] sm:text-[32px]">{item.name}</h2>
            <p className="mt-2 text-lg font-extrabold tracking-[-0.025em] text-[#172033] sm:text-[28px]">{formatMoney(item.price)}</p>
            {item.description && <p className="mt-4 text-[13px] leading-6 text-[#737B8C] sm:text-base sm:leading-7">{item.description}</p>}
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-extrabold text-[#172033] sm:text-lg">Choose variant</h3>
              <div className="divide-y divide-[#E3E7EA]">
                {item.variants.filter(v => v.is_available !== false).map((v) => (
                  <label
                    key={v.id}
                    className={`flex min-h-16 cursor-pointer items-center gap-4 py-4 transition-colors ${
                      selectedVariant === v.id
                        ? 'text-[#0E4B47]'
                        : 'text-[#172033] hover:text-[#0E4B47]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant === v.id}
                      onChange={() => setSelectedVariant(v.id)}
                      className="h-6 w-6 shrink-0 accent-[#16B8A6]"
                    />
                    <span className="flex-1 text-[13px] font-medium sm:text-base">{v.name}</span>
                    <span className="text-sm font-bold text-[#172033]">{v.price === item.price ? 'Included' : formatMoney(v.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-extrabold text-[#172033] sm:text-lg">Add extras</h3>
              <div className="divide-y divide-[#E3E7EA]">
                {item.addons.filter(a => a.is_available !== false).map((a) => (
                  <label
                    key={a.id}
                    className={`flex min-h-16 cursor-pointer items-center gap-4 py-4 transition-colors ${
                      (selectedAddons[a.id] ?? 0) > 0
                        ? 'text-[#0E4B47]'
                        : 'text-[#172033] hover:text-[#0E4B47]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(selectedAddons[a.id] ?? 0) > 0}
                      onChange={() => toggleAddon(a.id)}
                      className="h-6 w-6 shrink-0 accent-[#16B8A6]"
                    />
                    <span className="flex-1 text-[13px] font-medium sm:text-base">{a.name}</span>
                    <span className="text-sm font-semibold text-[#737B8C]">+{formatMoney(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add */}
          <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-[#E3E7EA] bg-white/96 px-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:sticky sm:-mx-7 sm:-mb-7 sm:rounded-b-[30px] sm:px-7 sm:pb-5">
            <div className="flex h-12 shrink-0 items-center rounded-full border border-[#16B8A6] bg-white text-[#0E4B47]">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-full w-9 items-center justify-center rounded-l-full transition hover:bg-[#E8F8F5] sm:w-11"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-6 text-center text-base font-extrabold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="flex h-full w-9 items-center justify-center rounded-r-full transition hover:bg-[#E8F8F5] sm:w-11"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="min-h-12 flex-1 whitespace-nowrap rounded-full bg-[#16B8A6] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(22,184,166,0.24)] transition hover:bg-[#109F90] focus-visible:ring-4 focus-visible:ring-[#16B8A6]/25 sm:text-base"
            >
              Add to cart · {formatMoney(total)}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
