'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { SmartHeroImage } from '@/components/home/SmartHeroImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHomeMenuOffers } from '@/hooks/useHomeMenuOffers';
import type { HomeMenuOffer } from '@/types/offer';

const GLOBAL_FALLBACK_OFFER: HomeMenuOffer = {
  id: 'mangaale-fallback',
  restaurantId: 0,
  restaurantName: 'Mangaale',
  title: 'Flat ₹100 OFF',
  subtitle: 'on your first 3 orders',
  badgeText: 'Limited time offer',
  ctaText: 'Order Now',
  ctaUrl: '/restaurants',
};

export function HomeOfferSlider() {
  const {
    data,
    isLoading,
    isError,
    hasCoordinates,
    isLockedRoute,
    lockedRestaurantId,
    lockedRestaurantName,
    lockedHomeLink,
  } = useHomeMenuOffers();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const offers = useMemo(() => data ?? [], [data]);
  const fallbackOffer = useMemo(
    () =>
      getFallbackOffer({
        hasCoordinates,
        isLockedRoute,
        lockedRestaurantId,
        lockedRestaurantName,
        lockedHomeLink,
      }),
    [hasCoordinates, isLockedRoute, lockedHomeLink, lockedRestaurantId, lockedRestaurantName]
  );
  const displayOffers = !isError && offers.length > 0 ? offers : fallbackOffer ? [fallbackOffer] : [];
  const activeSlot = Math.min(activeIndex, Math.max(displayOffers.length - 1, 0));
  const activeOffer = displayOffers[activeSlot];
  const showDots = displayOffers.length > 1;
  const isFallback = activeOffer?.id === GLOBAL_FALLBACK_OFFER.id || activeOffer?.id === 'locked-restaurant-fallback' || isError;

  useEffect(() => {
    if (activeIndex < displayOffers.length) return;
    const timer = window.setTimeout(() => setActiveIndex(0), 0);
    return () => window.clearTimeout(timer);
  }, [activeIndex, displayOffers.length]);

  useEffect(() => {
    if (isFallback || paused || displayOffers.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % displayOffers.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [displayOffers.length, isFallback, paused]);

  if (isLoading) return <HomeOfferSkeleton />;
  if (!activeOffer) return null;

  return (
    <motion.section
      className="page-container page-section"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="relative h-[210px] overflow-hidden rounded-card border border-brand-100 bg-brand-50 shadow-card sm:h-[260px] lg:h-[300px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={String(activeOffer.id)}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <SmartHeroImage
              key={activeOffer.imageUrl || String(activeOffer.id)}
              src={activeOffer.imageUrl}
              fallbackSrc={activeOffer.fallbackImageUrl || '/images/food-delivery-hero.png'}
              alt={getOfferImageAlt(activeOffer)}
              priority={activeSlot === 0}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#effbf8_0%,#effbf8_45%,rgba(239,251,248,0.92)_58%,rgba(239,251,248,0.18)_100%)]" />

            <div className="relative z-10 flex h-full max-w-[67%] flex-col justify-center px-5 py-4 sm:max-w-[58%] sm:px-8 lg:px-10">
              <span className="inline-flex w-fit rounded-full bg-brand-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand-900 sm:px-3 sm:text-[10px]">
                {activeOffer.badgeText || 'Exclusive Offer'}
              </span>
              <h2 className="mt-3 line-clamp-2 max-w-[520px] text-[24px] font-extrabold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[34px] lg:text-[42px]">
                {activeOffer.title}
              </h2>
              {activeOffer.subtitle && (
                <p className="mt-1.5 line-clamp-2 max-w-[430px] text-xs font-medium leading-4 text-ink-muted sm:mt-2 sm:text-base sm:leading-6 lg:text-lg">
                  {activeOffer.subtitle}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-5">
                <OfferCta offer={activeOffer} isLockedRoute={isLockedRoute} lockedHomeLink={lockedHomeLink} />
                {!hasCoordinates && !isLockedRoute && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-ink-muted backdrop-blur sm:inline-flex">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Set location to see nearby offers
                  </span>
                )}
              </div>
              {(activeOffer.restaurantName || activeOffer.deliveryTime || activeOffer.distanceKm != null) && (
                <p className="mt-4 hidden text-xs font-semibold text-ink-muted sm:block sm:text-sm">
                  {[activeOffer.restaurantName, activeOffer.displayPrice, activeOffer.deliveryTime, formatDistance(activeOffer.distanceKm)]
                    .filter(Boolean)
                    .join(' - ')}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {showDots && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-4">
            {displayOffers.map((offer, index) => (
              <button
                key={String(offer.id)}
                type="button"
                aria-label={`Show offer ${index + 1}`}
                aria-current={index === activeSlot ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-50 ${
                  index === activeSlot ? 'w-5 bg-brand-700' : 'w-2 bg-ink-subtle/45 hover:bg-brand-400'
                }`}
              />
            ))}
          </div>
        )}

        {isFallback && <span className="sr-only">Mangaale featured offer</span>}
      </div>
    </motion.section>
  );
}

function OfferCta({
  offer,
  isLockedRoute,
  lockedHomeLink,
}: {
  offer: HomeMenuOffer;
  isLockedRoute: boolean;
  lockedHomeLink: string;
}) {
  const href = getOfferHref(offer, isLockedRoute, lockedHomeLink);
  const className =
    'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-700 px-5 text-sm font-extrabold text-white shadow-brand transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 sm:h-11 sm:px-6 sm:text-[15px]';

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className}>
        {offer.ctaText || 'Order Now'}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {offer.ctaText || 'Order Now'}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function getFallbackOffer({
  hasCoordinates,
  isLockedRoute,
  lockedRestaurantId,
  lockedRestaurantName,
  lockedHomeLink,
}: {
  hasCoordinates: boolean;
  isLockedRoute: boolean;
  lockedRestaurantId: number | null;
  lockedRestaurantName: string | null;
  lockedHomeLink: string;
}): HomeMenuOffer | null {
  if (isLockedRoute) {
    const restaurantName = lockedRestaurantName ?? 'this restaurant';

    return {
      id: 'locked-restaurant-fallback',
      restaurantId: lockedRestaurantId ?? 0,
      restaurantName,
      title: `Order from ${restaurantName}`,
      subtitle: "Browse this restaurant's menu and place your delivery order.",
      badgeText: 'Mangaale',
      ctaText: 'View Menu',
      ctaUrl: lockedHomeLink,
    };
  }

  if (hasCoordinates) return GLOBAL_FALLBACK_OFFER;

  return {
    ...GLOBAL_FALLBACK_OFFER,
    subtitle: 'Set your location to discover nearby offers.',
  };
}

function getOfferHref(offer: HomeMenuOffer, isLockedRoute: boolean, lockedHomeLink: string) {
  if (isLockedRoute && lockedHomeLink.startsWith('/r/')) return lockedHomeLink;
  return offer.ctaUrl || (offer.restaurantId ? `/restaurants/${offer.restaurantId}` : '/');
}

function HomeOfferSkeleton() {
  return (
    <section className="page-container page-section" aria-label="Loading offers">
      <Skeleton className="h-[210px] w-full rounded-card sm:h-[260px] lg:h-[300px]" />
    </section>
  );
}

function getOfferImageAlt(offer: HomeMenuOffer) {
  return [offer.title, offer.restaurantName].filter(Boolean).join(' from ') || 'Mangaale food offer';
}

function formatDistance(distanceKm?: number) {
  if (distanceKm == null) return undefined;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}
