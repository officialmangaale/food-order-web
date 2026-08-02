'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed left-0 right-0 z-40 p-3 safe-bottom backdrop-blur-xl sm:p-4 ${
            floatsAboveNavigation ? 'bottom-[86px] md:bottom-0' : 'bottom-0'
          }`}
        >
          <Link href="/cart" className="mx-auto block w-full max-w-[520px]">
            <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-[#0E4B47] px-4 py-3 text-white shadow-[0_14px_38px_rgba(14,75,71,0.24)] transition hover:bg-[#0C7C72] sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-normal">
                  {totalItems} item{totalItems === 1 ? '' : 's'}
                </p>
                <p className="truncate text-sm font-semibold sm:text-base">
                  {formatMoney(estimatedSubtotal)}{' '}
                  <span className="font-normal text-white/90">plus taxes</span>
                </p>
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
  );
}
