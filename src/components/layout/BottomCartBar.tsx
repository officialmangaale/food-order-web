'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatMoney } from '@/utils/money';
import { useHasMounted } from '@/hooks/useHasMounted';

export function BottomCartBar() {
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems());
  const estimatedSubtotal = useCartStore((state) => state.estimatedSubtotal());
  const hidden =
    pathname === '/checkout' ||
    pathname === '/cart' ||
    pathname === '/search' ||
    pathname.startsWith('/orders/') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/search');
  const floatsAboveNavigation =
    pathname === '/' ||
    pathname === '/restaurants' ||
    pathname === '/trending' ||
    pathname.startsWith('/categories/');

  if (!hasMounted || hidden) return null;

  return (
    <>
      <AnimatePresence>
        {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed left-0 right-0 z-40 p-4 safe-bottom backdrop-blur-xl ${
            floatsAboveNavigation ? 'bottom-[86px] md:bottom-0' : 'bottom-0'
          }`}
        >
          <Link href="/cart" className="mx-auto block w-full max-w-[520px]">
            <div className="flex min-h-[60px] items-center justify-between gap-3 rounded-card bg-brand-900 px-4 py-2.5 text-white shadow-brand transition hover:bg-brand-800 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12">
                  <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-white/80">
                    {totalItems} item{totalItems === 1 ? '' : 's'}
                  </p>
                  <p className="truncate text-[15px] font-bold sm:text-base">
                    {formatMoney(estimatedSubtotal)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm font-extrabold sm:text-base">
                <span>View Cart</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </Link>
        </motion.div>
        )}
      </AnimatePresence>
      {items.length > 0 && <div className="h-[72px] sm:h-[88px]" aria-hidden="true" />}
    </>
  );
}
