'use client';

import Link from 'next/link';
import { Plus, Store } from 'lucide-react';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { getCartItemKey } from '@/components/cart/cartUtils';
import type { CartItem } from '@/types/cart';

interface RestaurantCartCardProps {
  restaurantName: string;
  items: CartItem[];
  addMoreHref: string;
  onIncrease: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

export function RestaurantCartCard({
  restaurantName,
  items,
  addMoreHref,
  onIncrease,
  onDecrease,
  onRemove,
}: RestaurantCartCardProps) {
  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_16px_40px_rgba(123,35,35,0.06)] sm:p-6">
      <div className="flex items-center gap-3">
        <Store className="h-6 w-6 text-[#B31317]" aria-hidden="true" />
        <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717]">
          {restaurantName || 'Mangaale Restaurant'}
        </h2>
      </div>

      <div className="mt-5 divide-y divide-[#F0DDDD] border-y border-[#F0DDDD]">
        {items.map((item) => (
          <CartItemRow
            key={getCartItemKey(item)}
            item={item}
            onIncrease={() => onIncrease(item)}
            onDecrease={() => onDecrease(item)}
            onRemove={() => onRemove(item)}
          />
        ))}
      </div>

      <div className="pt-5 text-center">
        <Link
          href={addMoreHref}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold tracking-[0.08em] text-[#A80F15] transition hover:bg-[#FFF0F0]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add more items from {restaurantName || 'this restaurant'}
        </Link>
      </div>
    </section>
  );
}
