'use client';

import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CheckoutLoginPromptProps {
  onLogin: () => void;
}

export function CheckoutLoginPrompt({ onLogin }: CheckoutLoginPromptProps) {
  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_12px_30px_rgba(123,35,35,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-normal text-[#1F1717]">Login to continue</h2>
            <p className="mt-1 text-sm leading-6 text-[#6B4B4B]">
              Verify your phone number to place your order.
            </p>
          </div>
        </div>
        <Button onClick={onLogin} className="bg-[#A80F15] hover:bg-[#8F0D12]">
          Login with OTP
        </Button>
      </div>
    </section>
  );
}
