'use client';

import { useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AppliedCouponRow } from '@/components/coupon/AppliedCouponRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatMoney, formatMoneyDecimal } from '@/utils/money';
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
  const displayCouponDiscount = hasBackendSummary ? totals.discount_amount : 0;
  const displayOfferDiscount = hasBackendSummary ? totals.offer_discount_amount : 0;

  // 4. Delivery Fee & 5. Extra Charges
  const displayDeliveryFee = hasBackendSummary ? totals.delivery_fee : 0;
  const displayExtraCharges = hasBackendSummary ? totals.extra_charges : 0;

  const displayPlatformFee = hasBackendSummary ? totals.platform_fee_amount : 0;

  const displayCgst = hasBackendSummary ? totals.cgst : 0;
  const displaySgst = hasBackendSummary ? totals.sgst : 0;
  const displayTaxAmount = hasBackendSummary ? totals.tax_amount : 0;
  const displayExactTotal = hasBackendSummary ? totals.exact_total_amount : 0;
  const displayGrandTotal = hasBackendSummary ? totals.grand_total : 0;
  const displayRoundOff = hasBackendSummary ? totals.round_off_amount : 0;

  const showBillBreakdown = hasBackendSummary;
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

  const placeOrderLabel = placing
    ? 'Placing order...'
    : hasBackendSummary
      ? `Place order · ${formatMoneyDecimal(displayGrandTotal)}`
      : 'Place order';

  return (
    <>
      <Card
        as="aside"
        className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-section text-ink">Order summary</h2>
            {restaurantName && (
              <p className="mt-1 truncate text-sm font-medium text-ink-muted">
                From {restaurantName}
              </p>
            )}
          </div>
          {validating && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Checking
            </span>
          )}
        </div>

        <ul className="mt-5 space-y-3">
          {safeItems.map((item) => (
            <li key={`${item.item_id}-${item.variant_id ?? 'base'}`} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-surface-muted px-1 text-xs font-bold tabular-nums text-ink-muted">
                {item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{item.name}</p>
                {(item.variant_name || (item.addons?.length ?? 0) > 0) && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink-subtle">
                    {[item.variant_name, (item.addons ?? []).map((addon) => addon.name).join(', ')]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <p className="shrink-0 font-bold text-ink">{formatMoney(getLineTotal(item))}</p>
            </li>
          ))}
        </ul>

        <div className="my-5 h-px bg-line" />

        {(validationError || totalInvalid) && (
          <div
            role="alert"
            className="mb-5 rounded-control bg-danger-tint px-3 py-3 text-sm font-semibold text-danger"
          >
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{totalInvalid ? 'Unable to calculate order total. Please retry.' : validationError}</p>
            </div>
            {onRetrySummary && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetrySummary}>
                Retry summary
              </Button>
            )}
          </div>
        )}

        <dl className="space-y-2.5 text-sm">
          {awaitingBackendSummary && <SummarySkeleton />}
          {estimated && !validating && !validationError && !totalInvalid && (
            <p className="rounded-control bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-muted">
              Final charges are confirmed before you pay.
            </p>
          )}
          {showBillBreakdown && (
            <>
              <BillRow label="Item subtotal" value={displaySubtotal} />
              {couponCode && displayCouponDiscount > 0 ? (
                <AppliedCouponRow code={couponCode} discountAmount={displayCouponDiscount} />
              ) : (
                <BillRow label="Coupon discount" value={-displayCouponDiscount} highlight />
              )}
              <BillRow label="Offer discount" value={-displayOfferDiscount} highlight />
              <BillRow label="Delivery fee" value={displayDeliveryFee} />
              <BillRow label="Extra charges" value={displayExtraCharges} />
              <BillRow label="CGST" value={displayCgst} />
              <BillRow label="SGST" value={displaySgst} />
              <BillRow label="Platform fee" value={displayPlatformFee} />
              <BillRow label="Round off" value={displayRoundOff} />
              <BillRow label="Exact total" value={displayExactTotal} strong />
            </>
          )}
        </dl>

        <div className="my-5 h-px bg-line" />

        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base font-extrabold text-ink">Grand total</span>
          <span className="text-title text-ink">
            {hasBackendSummary ? formatMoneyDecimal(displayGrandTotal) : 'Calculating'}
          </span>
        </div>

        {placeDisabledReason && (
          <p className="mt-4 rounded-control bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-muted">
            {placeDisabledReason}
          </p>
        )}

        {/* Desktop action. On mobile the sticky bar below owns this. */}
        <Button
          fullWidth
          size="lg"
          loading={placing}
          disabled={placeDisabled}
          onClick={onPlaceOrder}
          className="mt-5 hidden lg:inline-flex"
        >
          {placeOrderLabel}
        </Button>
      </Card>

      {/* Mobile: the primary action stays reachable without scrolling to the
          bottom of a long checkout form. */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 backdrop-blur-xl lg:hidden">
        <Button
          fullWidth
          size="lg"
          loading={placing}
          disabled={placeDisabled}
          onClick={onPlaceOrder}
        >
          {placeOrderLabel}
        </Button>
      </div>
    </>
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
    <div className="flex items-baseline justify-between gap-4">
      <dt className={highlight ? 'text-success' : strong ? 'font-extrabold text-ink' : 'text-ink-muted'}>
        {label}
      </dt>
      <dd
        className={`shrink-0 text-right tabular-nums ${
          highlight ? 'font-bold text-success' : strong ? 'font-extrabold text-ink' : 'font-semibold text-ink'
        }`}
      >
        {value < 0 ? `-${formatMoneyDecimal(Math.abs(value))}` : formatMoneyDecimal(value)}
      </dd>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div
      className="space-y-3 rounded-control bg-surface-sunken px-3 py-3"
      aria-label="Fetching order summary"
    >
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <span className="skeleton-shimmer h-3 w-28 rounded" />
          <span className="skeleton-shimmer h-3 w-16 rounded" />
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
