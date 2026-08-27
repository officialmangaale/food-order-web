'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useCartStore } from '@/store/cartStore';

interface Props {
  open: boolean;
  onClose: () => void;
  newRestaurantName: string;
  onCleared?: () => void;
}

export function CartConflictModal({ open, onClose, newRestaurantName, onCleared }: Props) {
  const oldName = useCartStore((s) => s.restaurantName);
  const clearCart = useCartStore((s) => s.clearCart);

  return (
    <ConfirmDialog open={open} onClose={onClose} title="Start a new cart?">
      <p className="text-sm leading-6 text-ink-muted">
        Your cart has items from <span className="font-bold text-ink">{oldName}</span>. Mangaale
        delivers one restaurant per order, so adding from{' '}
        <span className="font-bold text-ink">{newRestaurantName}</span> will clear the current cart.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" fullWidth onClick={onClose}>
          Keep current cart
        </Button>
        <Button
          fullWidth
          onClick={() => {
            clearCart();
            onCleared?.();
            onClose();
          }}
        >
          Clear and add
        </Button>
      </div>
    </ConfirmDialog>
  );
}
