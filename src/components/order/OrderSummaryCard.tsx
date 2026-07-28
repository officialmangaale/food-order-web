'use client';

import { MapPin, ReceiptText, Store } from 'lucide-react';
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
  const progress = getOrderProgress(
    order.orderStatus,
    order.deliveryStatus,
    order.orderType,
  );
  const addressLine = formatAddress(order);
  const hasTaxBreakdown = typeof order.cgst === 'number' || typeof order.sgst === 'number';

  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_18px_46px_rgba(123,35,35,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
            <Store className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="truncate text-3xl font-extrabold tracking-normal text-[#1F1717]">
            {order.restaurant.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-[#5F4444]">
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} | {formatMoney(order.grandTotal)}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-[#A80F15] transition hover:bg-[#FFF0F0]"
          onClick={() => toast('Receipt will be available soon', 'info')}
        >
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
          Receipt
        </button>
      </div>

      <div className="mt-5 border-t border-[#F0DADA] pt-3">
        {order.items.length > 0 ? (
          order.items.map((item, index) => (
            <OrderItemRow key={`${item.itemId ?? item.name}-${index}`} item={item} />
          ))
        ) : (
          <p className="rounded-xl bg-[#FFF7F5] px-4 py-3 text-sm font-semibold text-[#6B4B4B]">
            Ordered items are not available yet.
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-[#F0DADA] pt-4 text-sm font-semibold text-[#5F4444]">
        {typeof order.subtotal === 'number' && <SummaryRow label="Subtotal" value={formatMoney(order.subtotal)} />}
        {typeof order.deliveryCharge === 'number' && order.deliveryCharge > 0 && (
          <SummaryRow label="Delivery" value={formatMoney(order.deliveryCharge)} />
        )}
        {typeof order.extraCharges === 'number' && order.extraCharges > 0 && (
          <SummaryRow label="Extra Charges" value={formatMoney(order.extraCharges)} />
        )}
        {hasTaxBreakdown ? (
          <>
            {typeof order.cgst === 'number' && order.cgst > 0 && <SummaryRow label="CGST" value={formatMoney(order.cgst)} />}
            {typeof order.sgst === 'number' && order.sgst > 0 && <SummaryRow label="SGST" value={formatMoney(order.sgst)} />}
          </>
        ) : typeof order.taxAmount === 'number' && order.taxAmount > 0 ? (
          <SummaryRow label="Taxes" value={formatMoney(order.taxAmount)} />
        ) : null}
        {typeof order.platformFeeAmount === 'number' && order.platformFeeAmount > 0 && (
          <SummaryRow label="Platform Fee" value={formatMoney(order.platformFeeAmount)} />
        )}
        {typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
          <SummaryRow label="Discount" value={`-${formatMoney(order.discountAmount)}`} accent />
        )}
        {typeof order.offerDiscountAmount === 'number' && order.offerDiscountAmount > 0 && (
          <SummaryRow label="Offer Discount" value={`-${formatMoney(order.offerDiscountAmount)}`} accent />
        )}
        {typeof order.roundOffAmount === 'number' && order.roundOffAmount !== 0 && (
          <SummaryRow label="Round Off" value={formatMoney(order.roundOffAmount)} />
        )}
        {typeof order.exactTotalAmount === 'number' && order.exactTotalAmount > 0 && (
          <SummaryRow label="Exact Total" value={formatMoney(order.exactTotalAmount)} strong />
        )}
        <div className="flex items-end justify-between gap-4 pt-3 text-[#1F1717]">
          <span className="text-lg font-extrabold">Grand Total</span>
          <span className="text-3xl font-extrabold text-[#A80F15]">{formatMoney(order.grandTotal)}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8D6E6E]">
          Payment: {formatPaymentMethod(order.paymentMethod)}
        </p>
      </div>

      {addressLine && (
        <div className="mt-5 flex gap-3 rounded-2xl bg-[#FFF7F5] px-4 py-3 text-sm text-[#5F4444]">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#A80F15]" aria-hidden="true" />
          <p className="font-medium">{addressLine}</p>
        </div>
      )}

      <OrderSupportActions cancellable={progress.cancellable} />
    </section>
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
    <div className={`flex items-center justify-between gap-4 ${strong ? 'font-extrabold text-[#1F1717]' : ''}`}>
      <span>{label}</span>
      <span className={accent ? 'text-[#A80F15]' : 'text-[#1F1717]'}>{value}</span>
    </div>
  );
}

function formatPaymentMethod(method: string) {
  const normalized = method.trim().toLowerCase();
  if (normalized === 'cash' || normalized === 'cod' || normalized === 'cash_on_delivery') {
    return 'Cash on Delivery';
  }
  return method || 'Cash on Delivery';
}

function formatAddress(order: TrackingOrder) {
  const address = order.deliveryAddress;
  if (!address) return '';
  return [address.addressLine1, address.area, address.city, address.pincode].filter(Boolean).join(', ');
}
