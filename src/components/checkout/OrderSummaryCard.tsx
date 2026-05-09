'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/utils/money';
import type { CartItem, ValidatedTotals } from '@/types/cart';

interface OrderSummaryCardProps {
  items: CartItem[];
  restaurantName?: string;
  totals: ValidatedTotals;
  estimated: boolean;
  validating?: boolean;
  validationError?: string;
  totalInvalid?: boolean;
  placing?: boolean;
  placeDisabled?: boolean;
  placeDisabledReason?: string;
  onPlaceOrder: () => void;
}

export function OrderSummaryCard({
  items,
  restaurantName,
  totals,
  estimated,
  validating,
  validationError,
  totalInvalid,
  placing,
  placeDisabled,
  placeDisabledReason,
  onPlaceOrder,
}: OrderSummaryCardProps) {
  return (
    <aside className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_18px_42px_rgba(123,35,35,0.08)] lg:sticky lg:top-32">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717]">Order Summary</h2>
          {restaurantName && <p className="mt-1 text-sm font-medium text-[#7A5B5B]">From {restaurantName}</p>}
        </div>
        {validating && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F0] px-3 py-1 text-xs font-bold text-[#A80F15]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Validating
          </span>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={`${item.item_id}-${item.variant_id ?? 'base'}`} className="flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-[#1F1717]">{item.name}</p>
              <p className="mt-1 text-sm text-[#5D4444]">Qty: {item.quantity}</p>
              {(item.variant_name || item.addons.length > 0) && (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8A6B6B]">
                  {[item.variant_name, item.addons.map((addon) => addon.name).join(', ')].filter(Boolean).join(' / ')}
                </p>
              )}
            </div>
            <p className="shrink-0 font-bold text-[#1F1717]">{formatMoney(getLineTotal(item))}</p>
          </div>
        ))}
      </div>

      <div className="my-6 h-px bg-[#F1DEDE]" />

      {(validationError || totalInvalid) && (
        <div className="mb-5 flex gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{totalInvalid ? 'Unable to calculate order total. Please retry.' : validationError}</p>
        </div>
      )}

      <div className="space-y-3 text-[#3A2727]">
        <BillRow label={estimated ? 'Subtotal (Estimated)' : 'Subtotal'} value={totals.subtotal} />
        {totals.delivery_fee > 0 && <BillRow label="Delivery Fee" value={totals.delivery_fee} />}
        {totals.taxes > 0 && <BillRow label="Taxes" value={totals.taxes} />}
        {totals.discount > 0 && <BillRow label="Discount" value={-totals.discount} highlight />}
      </div>

      <div className="my-6 h-px bg-[#F1DEDE]" />

      <div className="mb-6 flex items-end justify-between gap-3">
        <span className="text-2xl font-extrabold text-[#1F1717]">Total</span>
        <span className="text-4xl font-extrabold tracking-normal text-[#A80F15]">
          {formatMoney(totals.total)}
        </span>
      </div>

      {placeDisabledReason && (
        <p className="mb-3 rounded-xl bg-[#FFF7F5] px-3 py-2 text-sm font-semibold text-[#8A5555]">
          {placeDisabledReason}
        </p>
      )}

      <Button
        fullWidth
        size="lg"
        loading={placing}
        disabled={placeDisabled}
        onClick={onPlaceOrder}
        className="bg-[#A80F15] shadow-[0_10px_20px_rgba(168,15,21,0.18)] hover:bg-[#8F0D12]"
      >
        {placing ? 'Placing order...' : `Place Order - ${formatMoney(totals.total)}`}
      </Button>
    </aside>
  );
}

function BillRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 text-base ${highlight ? 'font-bold text-green-700' : ''}`}>
      <span>{label}</span>
      <span>{value < 0 ? `-${formatMoney(Math.abs(value))}` : formatMoney(value)}</span>
    </div>
  );
}

function getLineTotal(item: CartItem) {
  const base = item.variant_price ?? item.base_price;
  const addons = item.addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0);
  return (base + addons) * item.quantity;
}
