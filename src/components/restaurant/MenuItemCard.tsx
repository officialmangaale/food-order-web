'use client';

import { motion } from 'framer-motion';
import { Plus, Minus, Leaf } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatMoney } from '@/utils/money';
import type { MenuItem } from '@/types/menu';

interface Props {
  item: MenuItem;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  onCustomize?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, restaurantId, restaurantName, restaurantSlug, onCustomize }: Props) {
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setRestaurant = useCartStore((s) => s.setRestaurant);
  const isDiff = useCartStore((s) => s.isDifferentRestaurant(restaurantId));

  const ci = cartItems.find((c) => c.item_id === item.id);
  const qty = ci?.quantity ?? 0;
  const hasCustom = (item.variants?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0;

  const handleAdd = () => {
    if (hasCustom || isDiff) { onCustomize?.(item); return; }
    setRestaurant(restaurantId, restaurantName, restaurantSlug);
    addItem({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      restaurant_slug: restaurantSlug,
      item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      quantity: 1,
      base_price: item.price,
      category_id: item.category_id,
      category_name: item.category_name,
      is_taxable: item.is_taxable,
      addons: [],
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {item.is_veg != null && (
            <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
            </span>
          )}
          {item.is_bestseller && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">★ Bestseller</span>}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
        <p className="text-sm font-bold text-gray-800 mt-1">{formatMoney(item.price)}</p>
        {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
        {hasCustom && <p className="text-[10px] text-gray-400 mt-1">Customisable</p>}
      </div>
      <div className="flex-shrink-0 w-28 relative">
        <div className="w-28 h-24 rounded-xl overflow-hidden">
          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : (
            <div className="w-full h-full food-placeholder flex items-center justify-center"><Leaf className="w-6 h-6 text-white/60" /></div>
          )}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          {qty === 0 ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAdd} disabled={item.is_available === false}
              className="bg-white border-2 border-cherry-600 text-cherry-600 font-bold text-sm px-6 py-1.5 rounded-xl shadow-sm hover:bg-cherry-50 disabled:opacity-50">ADD</motion.button>
          ) : (
            <div className="bg-cherry-600 text-white rounded-xl flex items-center shadow-sm">
              <button onClick={() => updateQuantity(item.id, qty - 1, ci?.variant_id)} className="px-2.5 py-1.5 rounded-l-xl"><Minus className="w-3.5 h-3.5" /></button>
              <span className="px-2 text-sm font-bold">{qty}</span>
              <button onClick={() => updateQuantity(item.id, qty + 1, ci?.variant_id)} className="px-2.5 py-1.5 rounded-r-xl"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
