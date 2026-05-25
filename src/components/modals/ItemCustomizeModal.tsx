'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF7F5] rounded-t-3xl max-h-[85vh] overflow-y-auto safe-bottom max-w-lg mx-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:max-h-[90vh] sm:w-[min(92vw,560px)] border border-[#F0DADA] shadow-2xl"
      >
        {/* Header image */}
        <div className="h-48 relative overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          {item.image_url && failedImageUrl !== item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setFailedImageUrl(item.image_url ?? null)}
            />
          ) : (
            <div className="w-full h-full food-placeholder flex items-center justify-center">
              <Leaf className="w-10 h-10 text-white/50" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm transition hover:bg-white"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#4B3A3A]" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-[#1F1A1A]">{item.name}</h2>
            <p className="text-base font-semibold text-[#4B3A3A] mt-1">{formatMoney(item.price)}</p>
            {item.description && <p className="text-sm text-[#7B6B6B] mt-1 leading-6">{item.description}</p>}
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold text-[#1F1A1A] mb-2">Choose variant</h3>
              <div className="space-y-2">
                {item.variants.filter(v => v.is_available !== false).map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedVariant === v.id
                        ? 'border-[#D71920] bg-[#FFF0F0]'
                        : 'border-[#E9CBCB] hover:border-[#D99A9A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant === v.id}
                      onChange={() => setSelectedVariant(v.id)}
                      className="accent-[#D71920]"
                    />
                    <span className="flex-1 text-sm font-medium text-[#1F1A1A]">{v.name}</span>
                    <span className="text-sm font-semibold text-[#4B3A3A]">{formatMoney(v.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold text-[#1F1A1A] mb-2">Add extras</h3>
              <div className="space-y-2">
                {item.addons.filter(a => a.is_available !== false).map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      (selectedAddons[a.id] ?? 0) > 0
                        ? 'border-[#D71920] bg-[#FFF0F0]'
                        : 'border-[#E9CBCB] hover:border-[#D99A9A]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(selectedAddons[a.id] ?? 0) > 0}
                      onChange={() => toggleAddon(a.id)}
                      className="accent-[#D71920] w-4 h-4"
                    />
                    <span className="flex-1 text-sm font-medium text-[#1F1A1A]">{a.name}</span>
                    <span className="text-sm text-[#7B6B6B]">+{formatMoney(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#F0DADA]">
            <div className="flex items-center gap-3 bg-[#F5ECEC] rounded-xl">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-2.5 transition hover:bg-[#E9CBCB] rounded-l-xl"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 text-[#4B3A3A]" />
              </button>
              <span className="font-extrabold text-base w-6 text-center text-[#1F1A1A]">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="p-2.5 transition hover:bg-[#E9CBCB] rounded-r-xl"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 text-[#4B3A3A]" />
              </button>
            </div>
            <Button onClick={handleAdd} size="lg">Add — {formatMoney(total)}</Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
