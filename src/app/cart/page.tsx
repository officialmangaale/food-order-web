'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus, ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCartStore } from '@/store/cartStore';
import { formatMoney } from '@/utils/money';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const estimatedSubtotal = useCartStore((s) => s.estimatedSubtotal());

  if (items.length === 0) {
    return (
      <PageShell>
        <EmptyState icon="cart" title="Your cart is empty"
          description="Add items from a restaurant to get started"
          actionLabel="Browse restaurants" onAction={() => router.push('/')} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-sm text-gray-500">From {restaurantName}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={`${item.item_id}-${item.variant_id ?? 'base'}`}
            className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex gap-4">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
              {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
              {item.addons.length > 0 && (
                <p className="text-xs text-gray-400">{item.addons.map(a => a.name).join(', ')}</p>
              )}
              <p className="text-sm font-bold text-gray-800 mt-1">
                {formatMoney((item.variant_price ?? item.base_price) * item.quantity)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => removeItem(item.item_id, item.variant_id)}
                className="p-1.5 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center bg-cherry-600 text-white rounded-lg">
                <button onClick={() => updateQuantity(item.item_id, item.quantity - 1, item.variant_id)} className="px-2 py-1">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.item_id, item.quantity + 1, item.variant_id)} className="px-2 py-1">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Estimated Subtotal</span>
          <span className="font-semibold">{formatMoney(estimatedSubtotal)}</span>
        </div>
        <p className="text-xs text-gray-400">Final total will be confirmed at checkout</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
        <Button fullWidth size="lg" onClick={() => router.push('/checkout')}>
          Proceed to Checkout — {formatMoney(estimatedSubtotal)}
        </Button>
      </div>
    </PageShell>
  );
}
