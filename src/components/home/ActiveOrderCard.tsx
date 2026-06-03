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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Link href={`/orders/${activeOrder.order_id}/track`}>
        <div className={`rounded-2xl p-4 flex items-center gap-3 shadow-card border ${
          isTerminal
            ? 'bg-[#F8F5F5] border-[#E8DFDF]'
            : 'bg-cherry-50 border-cherry-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isTerminal ? 'bg-[#EDEBEB]' : 'bg-cherry-100'
          }`}>
            <Truck className={`w-5 h-5 ${isTerminal ? 'text-[#7B6B6B]' : 'text-cherry-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1F1A1A] truncate">
              {activeOrder.restaurant_name}
            </p>
            <p className={`text-xs font-medium ${isTerminal ? 'text-[#7B6B6B]' : 'text-cherry-600'}`}>
              {label}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[#9B8A8A] flex-shrink-0">
            <span className="text-xs font-medium">Track</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
      {isTerminal && (
        <button
          onClick={(e) => { e.stopPropagation(); clearActiveOrder(); }}
          className="text-xs text-[#9B8A8A] hover:text-[#6B4B4B] mt-1 ml-2"
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
