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
    <ConfirmDialog open={open} onClose={onClose} title="Replace cart items?">
      <p className="text-sm text-gray-600 mb-5">
        Your cart has items from <span className="font-semibold text-gray-900">{oldName}</span>.
        Do you want to clear it and add items from <span className="font-semibold text-gray-900">{newRestaurantName}</span>?
      </p>
      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose}>Keep current cart</Button>
        <Button fullWidth onClick={() => { clearCart(); onCleared?.(); onClose(); }}>Clear &amp; add new</Button>
      </div>
    </ConfirmDialog>
  );
}
