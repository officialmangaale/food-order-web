'use client';

import Link from 'next/link';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CartInstructionsCard } from '@/components/cart/CartInstructionsCard';
import { CartOrderSummary } from '@/components/cart/CartOrderSummary';
import { CartPromoCard } from '@/components/cart/CartPromoCard';
import { RestaurantCartCard } from '@/components/cart/RestaurantCartCard';
import { getCartEstimatedSubtotal, hasInvalidCartPrice } from '@/components/cart/cartUtils';
import { useCheckoutInstructions } from '@/hooks/useCheckoutInstructions';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCartStore } from '@/store/cartStore';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import type { CartItem } from '@/types/cart';

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const restaurantSlug = useCartStore((state) => state.restaurantSlug);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const lockedMode = useRestaurantModeStore((state) => state.lockedMode);
  const lockedRestaurantSlug = useRestaurantModeStore((state) => state.lockedRestaurantSlug);
  const { instructions, setInstructions, clearInstructions } = useCheckoutInstructions();
  const hasMounted = useHasMounted();

  const subtotal = getCartEstimatedSubtotal(items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const invalidPrice = hasInvalidCartPrice(items);
  const mixedRestaurantWarning = getMixedRestaurantWarning(items, restaurantId);
  const addMoreHref = getAddMoreHref({
    restaurantId,
    restaurantSlug,
    lockedMode,
    lockedRestaurantSlug,
  });

  const handleClearCart = () => {
    clearCart();
    clearInstructions();
  };

  if (!hasMounted) return <CartPageSkeleton />;

  if (items.length === 0) {
    const emptyHref = lockedMode && lockedRestaurantSlug ? `/r/${lockedRestaurantSlug}` : '/';

    return (
      <main className="min-h-screen bg-[#FFF7F5]">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
          <CartHeading />
          <div className="mt-8 rounded-2xl border border-[#F0DADA] bg-white p-8 text-center shadow-[0_16px_40px_rgba(123,35,35,0.06)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
              <ShoppingBag className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-[#1F1717]">Your cart is empty</h2>
            <p className="mt-2 text-[#6B4B4B]">Add delicious items from restaurants near you.</p>
            <Link
              href={emptyHref}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#A80F15] px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#8F0D12]"
            >
              {lockedMode ? 'Back to Menu' : 'Browse Restaurants'}
            </Link>
          </div>
        </div>
        <CartFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF7F5]">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <CartHeading />
        <div className="mt-7 h-px bg-[#EEDADA]" />

        {mixedRestaurantWarning && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-extrabold">Your cart contains items from multiple restaurants.</p>
                <p className="mt-1 text-sm font-medium">Please clear cart and add items again.</p>
              </div>
            </div>
            <Button variant="outline" className="border-amber-300 bg-white text-amber-900" onClick={handleClearCart}>
              Clear Cart
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
          <div className="space-y-8">
            <RestaurantCartCard
              restaurantName={restaurantName}
              items={items}
              addMoreHref={addMoreHref}
              onIncrease={(item) => updateQuantity(item.item_id, item.quantity + 1, item.variant_id)}
              onDecrease={(item) => updateQuantity(item.item_id, item.quantity - 1, item.variant_id)}
              onRemove={(item) => removeItem(item.item_id, item.variant_id)}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <CartInstructionsCard value={instructions} onChange={setInstructions} />
              <CartPromoCard />
            </div>
          </div>

          <CartOrderSummary
            subtotal={subtotal}
            totalItems={totalItems}
            invalidPrice={invalidPrice}
            blockedReason={mixedRestaurantWarning}
          />
        </div>
      </div>
      <CartFooter />
    </main>
  );
}

function CartPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FFF7F5]">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <CartHeading />
        <div className="mt-7 h-px bg-[#EEDADA]" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
          <div className="space-y-8">
            <div className="h-[340px] animate-pulse rounded-2xl border border-[#F0DADA] bg-white shadow-[0_16px_40px_rgba(123,35,35,0.06)]" />
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="h-60 animate-pulse rounded-2xl border border-[#F0DADA] bg-white" />
              <div className="h-60 animate-pulse rounded-2xl border border-[#F0DADA] bg-white" />
            </div>
          </div>
          <div className="h-[360px] animate-pulse rounded-2xl border border-[#F0DADA] bg-white shadow-[0_18px_42px_rgba(123,35,35,0.08)]" />
        </div>
      </div>
    </main>
  );
}

function CartHeading() {
  return (
    <header>
      <h1 className="text-3xl font-extrabold leading-tight tracking-normal text-[#1F1717] sm:text-4xl lg:text-5xl">
        Your Cart
      </h1>
      <p className="mt-3 text-lg text-[#6B4B4B]">
        Review your selected items and prepare for checkout.
      </p>
    </header>
  );
}

function CartFooter() {
  return (
    <footer className="mt-14 border-t border-[#E9CFCF] bg-[#FFF0ED]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="text-2xl font-extrabold tracking-normal text-[#1F1717]">Mangaale</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#5F4444]">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/help">Help Center</Link>
          <Link href="/restaurants">Partner with Us</Link>
        </nav>
        <p className="text-sm text-[#6B5555]">{'\u00A9'} 2026 Mangaale. All rights reserved.</p>
      </div>
    </footer>
  );
}

function getAddMoreHref({
  restaurantId,
  restaurantSlug,
  lockedMode,
  lockedRestaurantSlug,
}: {
  restaurantId: number | null;
  restaurantSlug: string | null;
  lockedMode: boolean;
  lockedRestaurantSlug: string | null;
}) {
  const slug = restaurantSlug ?? lockedRestaurantSlug;
  if (lockedMode && slug) return `/r/${slug}`;
  if (restaurantId) return `/restaurants/${restaurantId}`;
  return '/';
}

function getMixedRestaurantWarning(items: CartItem[], restaurantId: number | null) {
  const ids = Array.from(
    new Set(
      items
        .map((item) => item.restaurant_id)
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
    )
  );

  if (ids.length > 1) return 'Mixed restaurant cart';
  if (restaurantId && ids.length === 1 && ids[0] !== restaurantId) return 'Mixed restaurant cart';
  return '';
}
