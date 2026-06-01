'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[checkout] render-fallback', error);
    }
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#FFF7F5] px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-[#F0DADA] bg-white p-8 text-center shadow-[0_16px_40px_rgba(123,35,35,0.06)]">
        <h1 className="text-2xl font-extrabold text-[#1F1717]">Checkout could not be loaded</h1>
        <p className="mt-3 text-[#6B4B4B]">
          We could not prepare your checkout right now. Your cart has been kept so you can retry safely.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-xl bg-[#A80F15] px-6 py-3 font-bold text-white transition hover:bg-[#8F0D12]"
          >
            Retry Checkout
          </button>
          <Link
            href="/cart"
            className="rounded-xl border border-[#E7CACA] px-6 py-3 font-bold text-[#5F3030] transition hover:bg-[#FFF0F0]"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    </main>
  );
}
