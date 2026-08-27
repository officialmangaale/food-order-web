'use client';

import { MapPin, ReceiptText, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { OrderItemRow } from '@/components/order/OrderItemRow';
import { OrderSupportActions } from '@/components/order/OrderSupportActions';
import type { TrackingOrder } from '@/types/order';
import { formatMoney } from '@/utils/money';
import { getOrderProgress } from '@/utils/orderStatus';

interface OrderSummaryCardProps {
  order: TrackingOrder;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  const { toast } = useToast();
  const progress = getOrderProgress(order.orderStatus, order.deliveryStatus, order.orderType);
  const addressLine = formatAddress(order);
  const hasTaxBreakdown = typeof order.cgst === 'number' || typeof order.sgst === 'number';

  return (
    <Card as="section">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
            <Store className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-ink sm:text-lg">
              {order.restaurant.name}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
              {formatMoney(order.grandTotal)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast('Receipt will be available soon', 'info')}
        >
          <ReceiptText className="h-4 w-4" aria-hidden="true" />
          Receipt
        </Button>
      </div>

      <div className="mt-5 divide-y divide-line border-t border-line pt-1">
        {order.items.length > 0 ? (
          order.items.map((item, index) => (
            <OrderItemRow key={`${item.itemId ?? item.name}-${index}`} item={item} />
          ))
        ) : (
          <p className="rounded-control bg-surface-sunken px-4 py-3 text-sm font-semibold text-ink-muted">
            Ordered items are not available yet.
          </p>
        )}
      </div>

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        {typeof order.subtotal === 'number' && (
          <SummaryRow label="Subtotal" value={formatMoney(order.subtotal)} />
        )}
        {typeof order.deliveryCharge === 'number' && order.deliveryCharge > 0 && (
          <SummaryRow label="Delivery" value={formatMoney(order.deliveryCharge)} />
        )}
        {typeof order.extraCharges === 'number' && order.extraCharges > 0 && (
          <SummaryRow label="Extra charges" value={formatMoney(order.extraCharges)} />
        )}
        {hasTaxBreakdown ? (
          <>
            {typeof order.cgst === 'number' && order.cgst > 0 && (
              <SummaryRow label="CGST" value={formatMoney(order.cgst)} />
            )}
            {typeof order.sgst === 'number' && order.sgst > 0 && (
              <SummaryRow label="SGST" value={formatMoney(order.sgst)} />
            )}
          </>
        ) : typeof order.taxAmount === 'number' && order.taxAmount > 0 ? (
          <SummaryRow label="Taxes" value={formatMoney(order.taxAmount)} />
        ) : null}
        {typeof order.platformFeeAmount === 'number' && order.platformFeeAmount > 0 && (
          <SummaryRow label="Platform fee" value={formatMoney(order.platformFeeAmount)} />
        )}
        {typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
          <SummaryRow label="Discount" value={`-${formatMoney(order.discountAmount)}`} accent />
        )}
        {typeof order.offerDiscountAmount === 'number' && order.offerDiscountAmount > 0 && (
          <SummaryRow
            label="Offer discount"
            value={`-${formatMoney(order.offerDiscountAmount)}`}
            accent
          />
        )}
        {typeof order.roundOffAmount === 'number' && order.roundOffAmount !== 0 && (
          <SummaryRow label="Round off" value={formatMoney(order.roundOffAmount)} />
        )}
        {typeof order.exactTotalAmount === 'number' && order.exactTotalAmount > 0 && (
          <SummaryRow label="Exact total" value={formatMoney(order.exactTotalAmount)} strong />
        )}

        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="text-base font-extrabold text-ink">Grand total</dt>
          <dd className="text-section text-ink">{formatMoney(order.grandTotal)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-eyebrow uppercase text-ink-subtle">
        Payment: {formatPaymentMethod(order.paymentMethod)}
      </p>

      {addressLine && (
        <div className="mt-5 flex gap-3 rounded-control bg-surface-sunken px-4 py-3 text-sm text-ink-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-800" aria-hidden="true" />
          <p>{addressLine}</p>
        </div>
      )}

      <OrderSupportActions cancellable={progress.cancellable} />
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? 'font-extrabold text-ink' : 'text-ink-muted'}>{label}</dt>
      <dd
        className={`shrink-0 tabular-nums ${
          accent ? 'font-bold text-success' : strong ? 'font-extrabold text-ink' : 'font-semibold text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatPaymentMethod(method: string) {
  const normalized = method.trim().toLowerCase();
  if (normalized === 'cash' || normalized === 'cod' || normalized === 'cash_on_delivery') {
    return 'Cash on delivery';
  }
  return method || 'Cash on delivery';
}

function formatAddress(order: TrackingOrder) {
  const address = order.deliveryAddress;
  if (!address) return '';
  return [address.addressLine1, address.area, address.city, address.pincode]
    .filter(Boolean)
    .join(', ');
}
