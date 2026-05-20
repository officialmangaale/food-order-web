'use client';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useGroceryCartStore } from '@/store/groceryCartStore';

interface GroceryCartConflictModalProps {
  open: boolean;
  onClose: () => void;
  newMerchantName: string;
  onCleared?: () => void;
}

export function GroceryCartConflictModal({
  open,
  onClose,
  newMerchantName,
  onCleared,
}: GroceryCartConflictModalProps) {
  const oldName = useGroceryCartStore((state) => state.merchantName);
  const clearCart = useGroceryCartStore((state) => state.clearCart);

  return (
    <ConfirmDialog open={open} onClose={onClose} title="Clear grocery cart?">
      <p className="mb-5 text-sm leading-6 text-gray-600">
        Your cart has items from{' '}
        <span className="font-semibold text-gray-900">{oldName || 'another store'}</span>.
        {' '}Clear cart to order from{' '}
        <span className="font-semibold text-gray-900">{newMerchantName}</span>?
      </p>
      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          fullWidth
          onClick={() => {
            clearCart();
            onCleared?.();
            onClose();
          }}
        >
          Clear and Add
        </Button>
      </div>
    </ConfirmDialog>
  );
}
