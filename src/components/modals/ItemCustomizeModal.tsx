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
      item_id: item.id, name: item.name, image_url: item.image_url, quantity: qty,
      variant_id: selectedVariant, variant_name: variant?.name, variant_price: variant?.price,
      base_price: item.price,
      addons: Object.entries(selectedAddons).map(([id, q]) => {
        const a = item.addons?.find((ad) => ad.id === Number(id));
        return { addon_id: Number(id), name: a?.name ?? '', price: a?.price ?? 0, quantity: q };
      }),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto safe-bottom max-w-lg mx-auto">
        {/* Header image */}
        <div className="h-48 relative">
          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> :
            <div className="w-full h-full food-placeholder flex items-center justify-center"><Leaf className="w-10 h-10 text-white/50" /></div>}
          <button onClick={onClose} className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
            <p className="text-base font-semibold text-gray-700 mt-1">{formatMoney(item.price)}</p>
            {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Choose variant</h3>
              <div className="space-y-2">
                {item.variants.filter(v => v.is_available !== false).map((v) => (
                  <label key={v.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedVariant === v.id ? 'border-cherry-500 bg-cherry-50' : 'border-gray-200'}`}>
                    <input type="radio" name="variant" checked={selectedVariant === v.id} onChange={() => setSelectedVariant(v.id)} className="accent-cherry-600" />
                    <span className="flex-1 text-sm font-medium">{v.name}</span>
                    <span className="text-sm font-semibold">{formatMoney(v.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Add extras</h3>
              <div className="space-y-2">
                {item.addons.filter(a => a.is_available !== false).map((a) => (
                  <label key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${(selectedAddons[a.id] ?? 0) > 0 ? 'border-cherry-500 bg-cherry-50' : 'border-gray-200'}`}>
                    <input type="checkbox" checked={(selectedAddons[a.id] ?? 0) > 0} onChange={() => toggleAddon(a.id)} className="accent-cherry-600 w-4 h-4" />
                    <span className="flex-1 text-sm font-medium">{a.name}</span>
                    <span className="text-sm text-gray-500">+{formatMoney(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2"><Minus className="w-4 h-4" /></button>
              <span className="font-bold text-base w-6 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2"><Plus className="w-4 h-4" /></button>
            </div>
            <Button onClick={handleAdd} size="lg">Add — {formatMoney(total)}</Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
