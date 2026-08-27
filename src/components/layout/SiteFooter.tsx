'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FOOTER_LINKS = [
  { href: '/restaurants', label: 'Browse Restaurants' },
  { href: '/trending', label: 'Trending' },
  { href: '/profile/orders', label: 'Your Orders' },
  { href: '/help', label: 'Help Center' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

/**
 * The single site footer. Replaces the five divergent per-page footers that
 * previously lived in cart, checkout, search, order tracking and restaurant
 * detail. Hidden on focused flows where a marketing footer is a distraction.
 */
export function SiteFooter() {
  const pathname = usePathname();

  const hidden =
    pathname === '/checkout' ||
    pathname.startsWith('/orders/') ||
    /^\/restaurants\/[^/]+/.test(pathname) ||
    pathname.startsWith('/r/');

  if (hidden) return null;

  return (
    <footer className="mt-[var(--page-section-gap)] border-t border-line bg-surface-sunken">
      <div className="page-container flex flex-col gap-6 py-10 lg:flex-row lg:items-start lg:justify-between lg:py-12">
        <div className="max-w-xs">
          <p className="text-section leading-none text-brand-900">Mangaale</p>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Food from your favourite local restaurants, delivered within 7 km.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:gap-x-12">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-muted transition-colors hover:text-brand-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="page-container py-5">
          <p className="text-xs text-ink-subtle">
            {'©'} {new Date().getFullYear()} Mangaale. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
