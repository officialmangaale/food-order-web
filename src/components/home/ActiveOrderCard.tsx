'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Truck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { ORDER_STATUS_LABELS, isTerminalStatus } from '@/types/order';

export function ActiveOrderCard() {
  const activeOrder = useActiveOrderStore((s) => s.activeOrder);
  const clearActiveOrder = useActiveOrderStore((s) => s.clearActiveOrder);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);

  const visibility = getActiveOrderVisibility({
    activeOrder,
    isAuthenticated,
    token,
    userId: user?.id ?? user?.user_id,
    phone: user?.phone ?? phone,
  });

  useEffect(() => {
    debugActiveOrderVisibility(visibility.reason, {
      visible: visibility.visible,
      hasActiveOrder: Boolean(activeOrder),
      hasToken: Boolean(token),
    });

    if (activeOrder && !visibility.visible) {
      clearActiveOrder();
    }
  }, [activeOrder, clearActiveOrder, token, visibility.reason, visibility.visible]);

  if (!visibility.visible || !activeOrder) return null;

  const isTerminal = isTerminalStatus(activeOrder.status);
  const label = ORDER_STATUS_LABELS[activeOrder.status] ?? activeOrder.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        href={`/orders/${activeOrder.order_id}/track`}
        className="flex items-center gap-3 rounded-card border border-brand-200 bg-brand-50 p-4 shadow-card transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface text-brand-800">
          <Truck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-ink">
            {activeOrder.restaurant_name}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5">
            {!isTerminal && (
              <span
                className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-600"
                aria-hidden="true"
              />
            )}
            <span className="text-xs font-semibold text-brand-800">{label}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-brand-800">
          Track
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
      {isTerminal && (
        <button
          type="button"
          onClick={clearActiveOrder}
          className="mt-2 inline-flex min-h-11 items-center rounded-full px-2 text-xs font-semibold text-ink-subtle transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        >
          Dismiss
        </button>
      )}
    </motion.div>
  );
}

function getActiveOrderVisibility({
  activeOrder,
  isAuthenticated,
  token,
  userId,
  phone,
}: {
  activeOrder: ReturnType<typeof useActiveOrderStore.getState>['activeOrder'];
  isAuthenticated: boolean;
  token: string | null;
  userId?: number;
  phone?: string | null;
}) {
  if (!activeOrder) return { visible: false, reason: 'no-active-order' };
  if (!isAuthenticated || !token) return { visible: false, reason: 'logged-out' };

  const activeCustomerId = activeOrder.customer_id;
  if (activeCustomerId != null && userId != null) {
    return {
      visible: activeCustomerId === userId,
      reason: activeCustomerId === userId ? 'matching-customer-id' : 'customer-id-mismatch',
    };
  }

  const activePhone = normalizePhone(activeOrder.customer_phone);
  const currentPhone = normalizePhone(phone);
  if (activePhone && currentPhone) {
    return {
      visible: activePhone === currentPhone,
      reason: activePhone === currentPhone ? 'matching-phone' : 'phone-mismatch',
    };
  }

  return { visible: false, reason: 'missing-customer-binding' };
}

function normalizePhone(value?: string | null) {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits || undefined;
}

function debugActiveOrderVisibility(reason: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[active-order] visibility', { reason, ...details });
  }
}
