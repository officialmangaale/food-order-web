'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, Home, PackageCheck, ShoppingBasket } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHasMounted } from '@/hooks/useHasMounted';
import { getErrorMessage } from '@/services/http';
import { trackGroceryOrder } from '@/services/groceryApi';
import { useAuthStore } from '@/store/authStore';
import { formatMoney } from '@/utils/money';
import {
  GROCERY_STATUS_LABELS,
  GROCERY_TRACKING_STEPS,
  type GroceryOrderStatus,
  type GroceryTrackingOrder,
} from '@/types/grocery';

interface RasanTrackingPageProps {
  orderId: string;
}

export function RasanTrackingPage({ orderId }: RasanTrackingPageProps) {
  const hasMounted = useHasMounted();
  const token = useAuthStore((state) => state.token);
  const numericOrderId = useMemo(() => Number(orderId), [orderId]);
  const validOrderId = orderId.trim().length > 0 && (Number.isFinite(numericOrderId) || orderId.trim().length > 0);

  const trackingQuery = useQuery({
    queryKey: ['grocery-order-track', orderId, token],
    queryFn: () => trackGroceryOrder(orderId, token ?? undefined),
    enabled: validOrderId,
    retry: 1,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ['delivered', 'cancelled', 'rejected'].includes(status) ? false : 30_000;
    },
  });

  if (!hasMounted || trackingQuery.isLoading) return <RasanTrackingSkeleton />;

  if (!validOrderId) {
    return <TrackingError title="Order not found" message="We could not find this Rasan order." />;
  }

  if (trackingQuery.error) {
    return (
      <TrackingError
        title="Unable to load tracking"
        message={getErrorMessage(trackingQuery.error)}
        onRetry={() => trackingQuery.refetch()}
      />
    );
  }

  if (!trackingQuery.data) {
    return (
      <TrackingError
        title="Order not found"
        message="We could not find this Rasan order."
        onRetry={() => trackingQuery.refetch()}
      />
    );
  }

  const order = trackingQuery.data;

  return (
    <main className="min-h-screen bg-[#F7FBF4] pb-16">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5E7D2B]">Rasan tracking</p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#1C2616]">{order.display_order_id}</h1>
          </div>
          <Link
            href="/rasan"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#C9DDBA] bg-white px-4 text-sm font-extrabold text-[#2F4A1B] transition hover:bg-[#F3FAEF]"
          >
            Browse Rasan
          </Link>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF7E8] text-[#2F6B1F]">
                  <PackageCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-2xl font-extrabold text-[#1C2616]">
                    {GROCERY_STATUS_LABELS[order.status]}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#66745E]">
                    Your grocery order from {order.merchant_name} is being updated.
                  </p>
                </div>
              </div>
            </section>

            <StatusTimeline order={order} />

            <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <h2 className="text-xl font-extrabold text-[#1C2616]">Delivery address</h2>
              <div className="mt-4 flex gap-3 text-sm font-semibold text-[#53614B]">
                <Home className="mt-0.5 h-5 w-5 shrink-0 text-[#3F7226]" aria-hidden="true" />
                <div>
                  <p>{order.delivery_address?.address || 'Delivery address'}</p>
                  {order.delivery_address?.landmark && (
                    <p className="mt-1 text-[#66745E]">Landmark: {order.delivery_address.landmark}</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#5E7D2B]">Merchant</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1C2616]">{order.merchant_name}</h2>
              <p className="mt-1 text-sm font-semibold capitalize text-[#66745E]">Payment: {order.payment_method}</p>
            </section>

            <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <h2 className="text-xl font-extrabold text-[#1C2616]">Items</h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item, index) => (
                  <div key={`${item.grocery_product_id ?? item.name}-${index}`} className="flex justify-between gap-3 text-sm">
                    <div>
                      <p className="font-bold text-[#1C2616]">{item.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-[#66745E]">
                        {[item.brand, item.package_size, `Qty ${item.quantity}`].filter(Boolean).join(' - ')}
                      </p>
                    </div>
                    <p className="shrink-0 font-extrabold text-[#1C2616]">
                      {formatMoney(item.line_total ?? (item.unit_price ?? 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <h2 className="text-xl font-extrabold text-[#1C2616]">Bill</h2>
              <div className="mt-4 space-y-3 text-sm font-semibold text-[#53614B]">
                <BillRow label="Subtotal" value={formatMoney(order.subtotal)} />
                <BillRow label="Delivery fee" value={order.delivery_fee > 0 ? formatMoney(order.delivery_fee) : 'Free'} />
                <div className="border-t border-[#E6F0DF] pt-3">
                  <BillRow label="Grand total" value={formatMoney(order.grand_total)} strong />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StatusTimeline({ order }: { order: GroceryTrackingOrder }) {
  const currentIndex = Math.max(0, GROCERY_TRACKING_STEPS.indexOf(order.status));
  const negative = ['cancelled', 'rejected'].includes(order.status);

  return (
    <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
      <h2 className="text-xl font-extrabold text-[#1C2616]">Status timeline</h2>
      {negative ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          This order could not be completed.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {GROCERY_TRACKING_STEPS.map((step, index) => {
            const complete = index <= currentIndex;
            return (
              <div key={step} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    complete ? 'bg-[#2F6B1F] text-white' : 'bg-[#EEF2EA] text-[#8B9982]'
                  }`}
                >
                  {complete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Clock className="h-4 w-4" aria-hidden="true" />}
                </span>
                <div>
                  <p className={`font-extrabold ${complete ? 'text-[#1C2616]' : 'text-[#8B9982]'}`}>
                    {GROCERY_STATUS_LABELS[step]}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#66745E]">{getStatusTime(order, step)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getStatusTime(order: GroceryTrackingOrder, status: GroceryOrderStatus) {
  const times: Partial<Record<GroceryOrderStatus, string | undefined>> = {
    placed: order.placed_at,
    accepted: order.accepted_at,
    packing: order.packing_at,
    packed: order.packed_at,
    out_for_delivery: order.out_for_delivery_at,
    delivered: order.delivered_at,
  };

  const value = times[status];
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function BillRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'text-lg text-[#1C2616]' : ''}`}>
      <span>{label}</span>
      <span className={strong ? 'font-extrabold' : 'font-bold text-[#1C2616]'}>{value}</span>
    </div>
  );
}

function TrackingError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#F7FBF4]">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-extrabold text-[#1C2616]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#66745E]">{message}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2F6B1F] px-5 text-sm font-extrabold text-white transition hover:bg-[#265719]"
              >
                Retry
              </button>
            )}
            <Link
              href="/rasan"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#C9DDBA] bg-white px-5 text-sm font-extrabold text-[#2F4A1B] transition hover:bg-[#F3FAEF]"
            >
              Back to Rasan
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function RasanTrackingSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7FBF4]">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <ShoppingBasket className="h-8 w-8 text-[#8BAE65]" aria-hidden="true" />
          <Skeleton className="h-10 w-72" />
        </div>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
          <div className="space-y-5">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
