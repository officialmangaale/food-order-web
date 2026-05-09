'use client';

import { useState } from 'react';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function CartPromoCard() {
  const [promoCode, setPromoCode] = useState('');
  const { toast } = useToast();

  const handleApply = () => {
    toast('Promo codes coming soon', 'info');
  };

  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_16px_40px_rgba(123,35,35,0.05)] sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Tag className="h-5 w-5 text-[#A80F15]" aria-hidden="true" />
        <h2 className="text-xl font-extrabold tracking-normal text-[#1F1717]">Apply Promo Code</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
        <label htmlFor="cart-promo-code" className="sr-only">
          Promo code
        </label>
        <input
          id="cart-promo-code"
          value={promoCode}
          onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
          placeholder="Enter code"
          className="h-[52px] min-w-0 rounded-full border border-[#E7B8B3] bg-white px-5 text-base text-[#2B2020] outline-none transition placeholder:text-[#B29B9B] focus:border-[#B31317] focus:ring-4 focus:ring-[#B31317]/10"
        />
        <Button
          type="button"
          onClick={handleApply}
          className="h-[52px] w-full rounded-full bg-[#A80F15] px-6 hover:bg-[#8F0D12]"
        >
          Apply
        </Button>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#8A6B6B]">
        Discounts will appear only after backend coupon validation is available.
      </p>
    </section>
  );
}
