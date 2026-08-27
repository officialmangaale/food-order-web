'use client';

import { AlertTriangle } from 'lucide-react';
import { ButtonLink, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { PanelSkeleton, Skeleton } from '@/components/ui/Skeleton';
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

/** Two-column from lg up; the summary is sticky beside the item list. */
const LAYOUT = 'grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] lg:gap-8';

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
      <main id="main-content" className="page-main page-container">
        <PageHeader eyebrow="Cart" title="Your cart" backHref={emptyHref} backLabel="Keep browsing" />
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          description="Add dishes from restaurants near you and they will show up here."
        >
          <ButtonLink href={emptyHref} variant="primary" size="md">
            {lockedMode ? 'Back to menu' : 'Browse restaurants'}
          </ButtonLink>
        </EmptyState>
      </main>
    );
  }

  return (
    <main id="main-content" className="page-main page-container pb-cart-safe">
      <PageHeader
        eyebrow="Cart"
        title="Your cart"
        count={`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
        backHref={addMoreHref}
        backLabel="Add more items"
      />

      {mixedRestaurantWarning && (
        <Card tone="warning" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="text-sm font-extrabold text-ink">
                Your cart contains items from multiple restaurants.
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Please clear the cart and add items again.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearCart}>
            Clear cart
          </Button>
        </Card>
      )}

      <div className={LAYOUT}>
        <div className="space-y-6">
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
    </main>
  );
}

function CartPageSkeleton() {
  return (
    <main className="page-main page-container">
      <div className="mb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-8 w-48" />
      </div>
      <div className={LAYOUT}>
        <div className="space-y-6">
          <PanelSkeleton className="h-[340px]" />
          <div className="grid gap-6 xl:grid-cols-2">
            <PanelSkeleton className="h-56" />
            <PanelSkeleton className="h-56" />
          </div>
        </div>
        <PanelSkeleton className="h-[360px]" />
      </div>
    </main>
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
