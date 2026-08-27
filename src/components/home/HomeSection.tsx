'use client';

import { Children, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/components/layout/PageHeader';

interface HomeSectionProps {
  id?: string;
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Hides the heading visually but keeps it for screen readers. */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
  /** Set when the section is inside another layout that owns the container. */
  embedded?: boolean;
}

/**
 * The wrapper every homepage rail uses. Owns the container width, the vertical
 * rhythm and the entrance animation, so individual sections no longer repeat
 * `mx-auto max-w-7xl px-3 sm:px-6 lg:px-8` with slightly different values.
 */
export function HomeSection({
  id,
  title,
  description,
  viewAllHref,
  viewAllLabel,
  hideTitle,
  children,
  className = '',
  embedded,
}: HomeSectionProps) {
  const reduceMotion = useReducedMotion();
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <motion.section
      aria-labelledby={headingId}
      className={`page-section ${embedded ? '' : 'page-container'} ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {hideTitle ? (
        <h2 id={headingId} className="sr-only">
          {title}
        </h2>
      ) : (
        <SectionHeader
          title={title}
          description={description}
          href={viewAllHref}
          linkLabel={viewAllLabel}
        />
      )}
      {children}
    </motion.section>
  );
}

interface CardRailProps {
  children: ReactNode;
  /** Card width while horizontally scrolling on mobile. */
  itemWidth?: string;
  /** Grid columns once the rail becomes a grid. */
  gridClassName?: string;
  className?: string;
}

/**
 * Horizontal scroller on mobile, grid from `sm` up. Bleeds into the page
 * gutter so cards scroll edge-to-edge rather than looking clipped.
 */
export function CardRail({
  children,
  itemWidth = 'w-[158px]',
  gridClassName = 'sm:grid-cols-2 lg:grid-cols-3',
  className = '',
}: CardRailProps) {
  return (
    <div
      className={`hide-scrollbar snap-row gutter-bleed flex gap-3 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:gap-5 sm:overflow-visible sm:px-0 ${gridClassName} ${className}`}
    >
      {Children.map(children, (child) =>
        child == null ? null : (
          <div className={`${itemWidth} shrink-0 sm:w-auto`}>{child}</div>
        )
      )}
    </div>
  );
}
