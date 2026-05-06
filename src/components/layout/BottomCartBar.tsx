'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatMoney } from '@/utils/money';

export function BottomCartBar() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const estimatedSubtotal = useCartStore((s) => s.estimatedSubtotal());
  const restaurantName = useCartStore((s) => s.restaurantName);

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 safe-bottom"
        >
          <Link href="/cart" className="block max-w-3xl mx-auto">
            <div className="bg-cherry-600 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-elevated hover:bg-cherry-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-cherry-600 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-cherry-100 truncate max-w-[140px]">From {restaurantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{formatMoney(estimatedSubtotal)}</span>
                <span className="text-sm">→</span>
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
