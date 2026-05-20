'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useGroceryCartStore } from '@/store/groceryCartStore';
import { formatMoney } from '@/utils/money';
import { useHasMounted } from '@/hooks/useHasMounted';

export function BottomCartBar() {
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const isRasanRoute = pathname.startsWith('/rasan');
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems());
  const estimatedSubtotal = useCartStore((state) => state.estimatedSubtotal());
  const groceryItems = useGroceryCartStore((state) => state.items);
  const groceryTotalItems = useGroceryCartStore((state) => state.totalItems());
  const groceryEstimatedSubtotal = useGroceryCartStore((state) => state.estimatedSubtotal());
  const hidden = isRasanRoute
    ? pathname === '/rasan/cart' ||
      pathname === '/rasan/checkout' ||
      pathname.startsWith('/rasan/orders/')
    : pathname === '/checkout' ||
      pathname === '/cart' ||
      pathname === '/search' ||
      pathname.startsWith('/orders/') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/search');
  const activeItems = isRasanRoute ? groceryItems : items;
  const activeTotalItems = isRasanRoute ? groceryTotalItems : totalItems;
  const activeSubtotal = isRasanRoute ? groceryEstimatedSubtotal : estimatedSubtotal;
  const cartHref = isRasanRoute ? '/rasan/cart' : '/cart';
  const label = isRasanRoute ? 'View Rasan Cart' : 'View Cart';
  const subcopy = isRasanRoute ? 'backend validates total' : 'plus taxes';

  if (!hasMounted || hidden) return null;

  return (
    <AnimatePresence>
      {activeItems.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 safe-bottom sm:p-4"
        >
          <Link href={cartHref} className="mx-auto block w-full max-w-[520px]">
            <div className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white shadow-[0_14px_38px_rgba(47,74,27,0.24)] transition sm:px-6 ${
              isRasanRoute ? 'bg-[#2F6B1F] hover:bg-[#265719]' : 'bg-[#B4080B] hover:bg-[#A80F15]'
            }`}>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-normal">
                  {activeTotalItems} item{activeTotalItems === 1 ? '' : 's'}
                </p>
                <p className="truncate text-sm font-semibold sm:text-base">
                  {formatMoney(activeSubtotal)}{' '}
                  <span className="font-normal text-white/90">{subcopy}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm font-extrabold sm:text-base">
                <span>{label}</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
