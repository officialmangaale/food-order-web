'use client';

import { useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AppliedCouponRow } from '@/components/coupon/AppliedCouponRow';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/utils/money';
import type { CartItem, ValidatedTotals } from '@/types/cart';

interface OrderSummaryCardProps {
  items: CartItem[];
  restaurantName?: string;
  totals: ValidatedTotals;
  couponCode?: string;
  estimated: boolean;
  validating?: boolean;
  validationError?: string;
  totalInvalid?: boolean;
  placing?: boolean;
  placeDisabled?: boolean;
  placeDisabledReason?: string;
  onRetrySummary?: () => void;
  onPlaceOrder: () => void;
}

export function OrderSummaryCard({
  items,
  restaurantName,
  totals,
  couponCode,
  estimated,
  validating,
  validationError,
  totalInvalid,
  placing,
  placeDisabled,
  placeDisabledReason,
  onRetrySummary,
  onPlaceOrder,
}: OrderSummaryCardProps) {
  const awaitingBackendSummary = estimated && validating;
  const hasBackendSummary = !estimated;

  // 1. Item Subtotal: sum of item price x quantity from cart
  const safeItems = Array.isArray(items) ? items : [];
  const localSubtotal = safeItems.reduce((sum, item) => {
    const base = safeNumber(item.variant_price ?? item.base_price);
    const addons = (Array.isArray(item.addons) ? item.addons : [])
      .reduce((sum, addon) => sum + safeNumber(addon.price) * safeNumber(addon.quantity), 0);
    return sum + (base + addons) * safeNumber(item.quantity);
  }, 0);
  const displaySubtotal = hasBackendSummary ? totals.subtotal : localSubtotal;

  // 2. Coupon Discount & 3. Offer Discount
  const displayCouponDiscount = hasBackendSummary ? totals.discount_amount || totals.discount : 0;
  const displayOfferDiscount = hasBackendSummary ? totals.offer_discount_amount : 0;
  const totalDiscounts = displayCouponDiscount + displayOfferDiscount;

  // 4. Delivery Fee & 5. Extra Charges
  const displayDeliveryFee = hasBackendSummary ? totals.delivery_fee : 0;
  const displayExtraCharges = hasBackendSummary ? totals.extra_charges : 0;

  const displayPlatformFee = hasBackendSummary ? totals.platform_fee_amount || totals.platform_fee : 0;

  const displayCgst = hasBackendSummary ? totals.cgst : 0;
  const displaySgst = hasBackendSummary ? totals.sgst : 0;
  const displayTaxAmount = hasBackendSummary ? totals.tax_amount || totals.taxes || displayCgst + displaySgst : 0;

  const localExactTotal = displaySubtotal - totalDiscounts + displayDeliveryFee + displayExtraCharges + displayTaxAmount;
  const displayExactTotal = hasBackendSummary
    ? totals.exact_total_amount || totals.total || totals.grand_total || localExactTotal
    : localExactTotal;
  const displayGrandTotal = hasBackendSummary
    ? totals.grand_total || totals.total || displayExactTotal
    : displayExactTotal;
  const displayRoundOff = hasBackendSummary ? totals.round_off_amount : 0;

  const showBillBreakdown = !estimated || Boolean(displayGrandTotal || displaySubtotal);
  const displaySource = estimated ? (validating ? 'validate-pending' : 'fallback-local') : 'backend-validate';

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    console.debug('[checkout-billing]', {
      source: displaySource,
      hasBackendSummary,
      values: {
        subtotal: displaySubtotal,
        coupon_discount: displayCouponDiscount,
        offer_discount: displayOfferDiscount,
        delivery_fee: displayDeliveryFee,
        extra_charges: displayExtraCharges,
        cgst: displayCgst,
        sgst: displaySgst,
        tax_amount: displayTaxAmount,
        platform_fee: displayPlatformFee,
        round_off: displayRoundOff,
        exact_total: displayExactTotal,
        grand_total: displayGrandTotal,
      }
    });
  }, [displaySource, displaySubtotal, displayCouponDiscount, displayOfferDiscount, displayDeliveryFee, displayExtraCharges, displayCgst, displaySgst, displayTaxAmount, displayPlatformFee, displayRoundOff, displayExactTotal, displayGrandTotal, hasBackendSummary]);

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
        {safeItems.map((item) => (
          <div key={`${item.item_id}-${item.variant_id ?? 'base'}`} className="flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-[#1F1717]">{item.name}</p>
              <p className="mt-1 text-sm text-[#5D4444]">Qty: {item.quantity}</p>
              {(item.variant_name || (item.addons?.length ?? 0) > 0) && (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8A6B6B]">
                  {[item.variant_name, (item.addons ?? []).map((addon) => addon.name).join(', ')].filter(Boolean).join(' / ')}
                </p>
              )}
            </div>
            <p className="shrink-0 font-bold text-[#1F1717]">{formatMoney(getLineTotal(item))}</p>
          </div>
        ))}
      </div>

      <div className="my-6 h-px bg-[#F1DEDE]" />

      {(validationError || totalInvalid) && (
        <div className="mb-5 rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{totalInvalid ? 'Unable to calculate order total. Please retry.' : validationError}</p>
          </div>
          {onRetrySummary && (
            <button
              type="button"
              onClick={onRetrySummary}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 transition hover:bg-red-100"
            >
              Retry summary
            </button>
          )}
        </div>
      )}

      <div className="space-y-3 text-[#3A2727]">
        {awaitingBackendSummary && (
          <SummarySkeleton />
        )}
        {estimated && !validating && !validationError && !totalInvalid && (
          <p className="rounded-xl bg-[#FFF7F5] px-3 py-2 text-sm font-semibold text-[#8A5555]">
            Backend summary is not available yet.
          </p>
        )}
        {showBillBreakdown && (
          <>
            <BillRow label="Item Subtotal" value={displaySubtotal} />
            {couponCode && displayCouponDiscount > 0 ? (
              <AppliedCouponRow code={couponCode} discountAmount={displayCouponDiscount} />
            ) : (
              <BillRow label="Coupon Discount" value={-displayCouponDiscount} highlight />
            )}
            <BillRow label="Offer Discount" value={-displayOfferDiscount} highlight />
            <BillRow label="Delivery Fee" value={displayDeliveryFee} />
            <BillRow label="Extra Charges" value={displayExtraCharges} />
            <BillRow label="CGST" value={displayCgst} />
            <BillRow label="SGST" value={displaySgst} />
            <BillRow label="Platform Fee" value={displayPlatformFee} />
            <BillRow label="Round Off" value={displayRoundOff} />
            <BillRow label="Exact Total" value={displayExactTotal} strong />
          </>
        )}
      </div>

      <div className="my-6 h-px bg-[#F1DEDE]" />

      <div className="mb-6 flex items-end justify-between gap-3">
        <span className="text-2xl font-extrabold text-[#1F1717]">Grand Total</span>
        <span className="text-4xl font-extrabold tracking-normal text-[#A80F15]">
          {formatMoney(displayGrandTotal)}
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
        {placing ? 'Placing order...' : `Place Order - ${formatMoney(displayGrandTotal)}`}
      </Button>
    </aside>
  );
}

function BillRow({
  label,
  value,
  highlight,
  strong,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 text-base ${
        highlight ? 'font-bold text-green-700' : strong ? 'font-extrabold text-[#1F1717]' : ''
      }`}
    >
      <span>{label}</span>
      <span className="shrink-0 text-right">{value < 0 ? `-${formatMoney(Math.abs(value))}` : formatMoney(value)}</span>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 rounded-xl bg-[#FFF7F5] px-3 py-3" aria-label="Fetching backend order summary">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <span className="h-3 w-28 animate-pulse rounded bg-[#F0DADA]" />
          <span className="h-3 w-16 animate-pulse rounded bg-[#F0DADA]" />
        </div>
      ))}
    </div>
  );
}

function getLineTotal(item: CartItem) {
  const base = safeNumber(item.variant_price ?? item.base_price);
  const addons = (Array.isArray(item.addons) ? item.addons : [])
    .reduce((sum, addon) => sum + safeNumber(addon.price) * safeNumber(addon.quantity), 0);
  return (base + addons) * safeNumber(item.quantity);
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
