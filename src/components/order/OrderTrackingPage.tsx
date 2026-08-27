'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { OtpLoginModal } from '@/components/auth/OtpLoginModal';
import { EstimatedArrivalCard } from '@/components/order/EstimatedArrivalCard';
import { LiveTrackingTimeline } from '@/components/order/LiveTrackingTimeline';
import { MapPreviewCard } from '@/components/order/MapPreviewCard';
import { OrderSummaryCard } from '@/components/order/OrderSummaryCard';
import { OrderSuccessCard } from '@/components/order/OrderSuccessCard';
import { OrderTrackingError } from '@/components/order/OrderTrackingError';
import { OrderTrackingSkeleton } from '@/components/order/OrderTrackingSkeleton';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useOrderTracking } from '@/hooks/useOrderSSE';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { useAuthStore } from '@/store/authStore';
import { isTerminalStatus } from '@/types/order';
import { realtimeConnectionLabel } from '@/utils/realtimePolicy.mjs';

interface OrderTrackingPageProps {
  orderId: string;
}

export function OrderTrackingPage({ orderId }: OrderTrackingPageProps) {
  const hasMounted = useHasMounted();
  const numericOrderId = useMemo(() => Number(orderId), [orderId]);
  const validOrderId = Number.isFinite(numericOrderId) && numericOrderId > 0;
  const [loginOpen, setLoginOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const authPhone = useAuthStore((state) => state.phone);
  const setActiveOrder = useActiveOrderStore((state) => state.setActiveOrder);
  const { tracking, loading, error, errorStatus, authRequired, connected, connectionStatus, refetch } = useOrderTracking(
    validOrderId ? numericOrderId : 0
  );

  useEffect(() => {
    if (errorStatus !== 401) return;
    logout();
    const timer = window.setTimeout(() => setLoginOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [errorStatus, logout]);

  useEffect(() => {
    if (!tracking) return;
    setActiveOrder({
      order_id: typeof tracking.orderId === 'number' ? tracking.orderId : Number(tracking.orderId) || numericOrderId,
      restaurant_id: tracking.restaurant.id ?? 0,
      restaurant_name: tracking.restaurant.name,
      status: tracking.orderStatus,
      total: tracking.grandTotal,
      created_at: tracking.createdAt ?? new Date().toISOString(),
      customer_id: user?.id ?? user?.user_id,
      customer_phone: tracking.customer.phone ?? user?.phone ?? authPhone ?? undefined,
    });
  }, [authPhone, numericOrderId, setActiveOrder, tracking, user?.id, user?.phone, user?.user_id]);

  if (!hasMounted || loading) return <OrderTrackingSkeleton />;

  if (!validOrderId) {
    return (
      <OrderTrackingError
        title="Order not found"
        message="We could not find this order."
        showHomeLink
      />
    );
  }

  if (authRequired || errorStatus === 401) {
    return (
      <>
        <OrderTrackingError
          title="Login to view your order"
          message="Verify your phone number to see live tracking and order details."
          actionLabel="Login with OTP"
          onAction={() => setLoginOpen(true)}
          login
        />
        <OtpLoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onVerified={() => {
            setLoginOpen(false);
            void refetch();
          }}
        />
      </>
    );
  }

  if (errorStatus === 403) {
    return (
      <OrderTrackingError
        title="You are not allowed to view this order"
        message="Please sign in with the account that placed this order."
        showHomeLink
      />
    );
  }

  if (errorStatus === 404 || (!tracking && error)) {
    return (
      <OrderTrackingError
        title="Order not found"
        message={error || 'We could not find this order.'}
        actionLabel="Retry"
        onAction={() => void refetch()}
        showHomeLink
      />
    );
  }

  if (!tracking) {
    return (
      <OrderTrackingError
        title="Unable to load order"
        message={error || 'Please retry in a moment.'}
        actionLabel="Retry"
        onAction={() => void refetch()}
        showHomeLink
      />
    );
  }

  const terminal = isTerminalStatus(tracking.orderStatus);

  return (
    <main id="main-content" className="page-main page-container">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow uppercase text-brand-800">Order tracking</p>
          <p className="mt-1 text-sm font-medium text-ink-muted">
            Live updates for {tracking.displayOrderId}
          </p>
        </div>
        {!terminal && (
          <span
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold ${
              connected
                ? 'border-green-200 bg-success-tint text-success'
                : 'border-line-strong bg-surface text-ink-muted'
            }`}
          >
            {connected ? (
              <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {realtimeConnectionLabel(connectionStatus)}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,1fr)] lg:gap-8">
        <div className="space-y-6">
          <OrderSuccessCard order={tracking} />
          <EstimatedArrivalCard order={tracking} />
          <LiveTrackingTimeline order={tracking} />
        </div>
        <div className="space-y-6">
          <MapPreviewCard order={tracking} />
          <OrderSummaryCard order={tracking} />
        </div>
      </div>
    </main>
  );
}


