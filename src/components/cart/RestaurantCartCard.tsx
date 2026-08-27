'use client';

import Link from 'next/link';
import { Plus, Store } from 'lucide-react';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { getCartItemKey } from '@/components/cart/cartUtils';
import { Card, CardHeader } from '@/components/ui/Card';
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
  const name = restaurantName || 'Your restaurant';

  return (
    <Card as="section">
      <CardHeader
        title={name}
        description={`${items.length} ${items.length === 1 ? 'dish' : 'dishes'} in this order`}
        icon={<Store className="h-5 w-5" aria-hidden="true" />}
      />

      <div className="mt-2 divide-y divide-line">
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

      <div className="border-t border-line pt-4">
        <Link
          href={addMoreHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add more items
        </Link>
      </div>
    </Card>
  );
}
