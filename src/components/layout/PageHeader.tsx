'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  /** Small uppercase label above the title, e.g. "Category". */
  eyebrow?: string;
  title: string;
  /** Result count or subtitle, e.g. "24 of 120 dishes". */
  count?: string;
  /** Location / delivery-radius context, e.g. "Within 7 km of your location". */
  meta?: ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Filters, sort controls or actions rendered under the title block. */
  children?: ReactNode;
  className?: string;
}

/**
 * The shared listing-page header used by categories, restaurants, trending and
 * search. Previously each of these rebuilt the same back-link + eyebrow +
 * title + count block with its own colours and spacing.
 *
 * The title block reserves its height so a late-arriving result count does not
 * push the grid down.
 */
export function PageHeader({
  eyebrow,
  title,
  count,
  meta,
  backHref,
  backLabel = 'Home',
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-6 ${className}`}>
      {(backHref || meta) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Link>
          ) : (
            <span />
          )}
          {meta && <p className="text-sm font-semibold text-ink-muted">{meta}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-eyebrow uppercase text-brand-800">{eyebrow}</p>
          )}
          <h1 className="mt-1.5 text-title text-ink">{title}</h1>
        </div>
        {/* Fixed-height slot: keeps the grid from shifting when the count loads. */}
        <p className="min-h-5 shrink-0 text-sm font-bold text-ink-muted">{count ?? ' '}</p>
      </div>

      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** "See all" link target. */
  href?: string;
  linkLabel?: string;
  className?: string;
}

/** Section heading used by every homepage rail and menu group. */
export function SectionHeader({
  title,
  description,
  href,
  linkLabel = 'View all',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-section text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-brand-800 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
        >
          {linkLabel}
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
