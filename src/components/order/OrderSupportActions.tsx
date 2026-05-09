'use client';

import Link from 'next/link';
import { HelpCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface OrderSupportActionsProps {
  cancellable: boolean;
}

export function OrderSupportActions({ cancellable }: OrderSupportActionsProps) {
  const { toast } = useToast();

  return (
    <div className="mt-5 space-y-3">
      <Link
        href="/help"
        className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#FFF0F0] px-4 text-base font-bold text-[#2C1717] transition hover:bg-[#FFE0DC]"
      >
        <HelpCircle className="h-5 w-5" aria-hidden="true" />
        Contact Support
      </Link>

      {cancellable && (
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-[#5A3030] transition hover:bg-[#FFF7F5] disabled:cursor-not-allowed disabled:opacity-70"
          onClick={() => toast('Cancel order support is coming soon', 'info')}
        >
          <XCircle className="h-5 w-5" aria-hidden="true" />
          Cancel Order
        </button>
      )}
    </div>
  );
}
