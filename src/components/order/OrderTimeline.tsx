'use client';

import { motion } from 'framer-motion';
import { Check, Clock, XCircle } from 'lucide-react';
import { ORDER_TIMELINE_STEPS, ORDER_STATUS_LABELS, isNegativeStatus, type OrderStatus } from '@/types/order';

interface Props { currentStatus: OrderStatus; }

export function OrderTimeline({ currentStatus }: Props) {
  const isNeg = isNegativeStatus(currentStatus);
  const currentIdx = ORDER_TIMELINE_STEPS.indexOf(
    ORDER_TIMELINE_STEPS.find((s) => s === currentStatus || mapStatus(currentStatus) === s) ?? 'placed'
  );

  return (
    <div className="space-y-0">
      {isNeg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl mb-3">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-semibold text-red-700">{ORDER_STATUS_LABELS[currentStatus]}</span>
        </motion.div>
      )}
      {ORDER_TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= currentIdx && !isNeg;
        const active = idx === currentIdx && !isNeg;
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-green-500' : active ? 'bg-cherry-600' : 'bg-gray-200'
                }`}>
                {done ? <Check className="w-4 h-4 text-white" /> :
                  active ? <Clock className="w-3.5 h-3.5 text-white animate-pulse" /> :
                  <span className="w-2 h-2 rounded-full bg-gray-400" />}
              </motion.div>
              {idx < ORDER_TIMELINE_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`text-sm font-medium ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>
                {ORDER_STATUS_LABELS[step]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function mapStatus(s: OrderStatus): OrderStatus {
  if (s === 'confirmed') return 'accepted';
  if (s === 'completed') return 'delivered';
  if (s === 'pending') return 'placed';
  return s;
}
