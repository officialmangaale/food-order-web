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
    <main className="flex min-h-[70vh] items-center justify-center px-[var(--page-gutter)] py-12">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="text-title text-ink">Checkout could not be loaded</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          We could not prepare your checkout right now. Your cart has been kept so you can retry safely.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-700 px-6 text-[15px] font-bold text-white shadow-brand transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
          >
            Retry Checkout
          </button>
          <Link
            href="/cart"
            className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong bg-surface px-6 text-[15px] font-bold text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    </main>
  );
}
