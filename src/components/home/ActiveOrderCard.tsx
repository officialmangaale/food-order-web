'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Truck } from 'lucide-react';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { ORDER_STATUS_LABELS, isTerminalStatus } from '@/types/order';

export function ActiveOrderCard() {
  const activeOrder = useActiveOrderStore((s) => s.activeOrder);
  const clearActiveOrder = useActiveOrderStore((s) => s.clearActiveOrder);

  if (!activeOrder) return null;

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
            ? 'bg-gray-50 border-gray-200'
            : 'bg-cherry-50 border-cherry-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isTerminal ? 'bg-gray-200' : 'bg-cherry-100'
          }`}>
            <Truck className={`w-5 h-5 ${isTerminal ? 'text-gray-500' : 'text-cherry-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {activeOrder.restaurant_name}
            </p>
            <p className={`text-xs font-medium ${isTerminal ? 'text-gray-500' : 'text-cherry-600'}`}>
              {label}
            </p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
            <span className="text-xs font-medium">Track</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
      {isTerminal && (
        <button
          onClick={(e) => { e.stopPropagation(); clearActiveOrder(); }}
          className="text-xs text-gray-400 hover:text-gray-600 mt-1 ml-2"
        >
          Dismiss
        </button>
      )}
    </motion.div>
  );
}
