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
  title: 'Order delicious food near you',
  subtitle: 'Discover fresh meals and offers from active restaurants around you.',
  badgeText: 'Mangaale',
  ctaText: 'Explore Restaurants',
  ctaUrl: '/',
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
      className="order-2 mx-auto mt-6 w-full max-w-7xl px-4 sm:mt-9 sm:px-6 lg:px-8"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="relative h-[178px] overflow-hidden rounded-[24px] bg-[#103F3C] shadow-[0_18px_48px_rgba(14,75,71,0.16)] sm:h-[260px] lg:h-[340px]">
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
              fallbackSrc={activeOffer.fallbackImageUrl}
              alt={getOfferImageAlt(activeOffer)}
              priority={activeSlot === 0}
            />
            <div className="absolute inset-0 bg-[#103F3C]/35" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#103F3C] from-0% via-[#103F3C]/95 via-48% to-[#103F3C]/12" />

            <div className="relative z-10 flex h-full max-w-[64%] flex-col justify-center px-5 py-4 sm:max-w-[58%] sm:px-8 lg:px-10">
              <span className="hidden w-fit rounded-full bg-white/14 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm sm:inline-flex">
                {activeOffer.badgeText || 'Exclusive Offer'}
              </span>
              <h2 className="max-w-[500px] text-base font-extrabold leading-[1.12] tracking-[-0.025em] text-white sm:mt-4 sm:text-[34px] lg:text-[44px]">
                {activeOffer.title}
              </h2>
              {activeOffer.subtitle && (
                <p className="mt-2 line-clamp-1 max-w-[430px] text-[11px] font-medium leading-4 text-white/80 sm:mt-3 sm:line-clamp-2 sm:text-base sm:leading-6 lg:text-lg">
                  {activeOffer.subtitle}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 sm:mt-5">
                <OfferCta offer={activeOffer} isLockedRoute={isLockedRoute} lockedHomeLink={lockedHomeLink} />
                {!hasCoordinates && !isLockedRoute && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-white/12 px-3 py-2 text-xs font-semibold text-white/85 backdrop-blur sm:inline-flex">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Set location to see nearby offers
                  </span>
                )}
              </div>
              {(activeOffer.restaurantName || activeOffer.deliveryTime || activeOffer.distanceKm != null) && (
                <p className="mt-4 hidden text-xs font-semibold text-white/75 sm:block sm:text-sm">
                  {[activeOffer.restaurantName, activeOffer.displayPrice, activeOffer.deliveryTime, formatDistance(activeOffer.distanceKm)]
                    .filter(Boolean)
                    .join(' - ')}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {showDots && (
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {displayOffers.map((offer, index) => (
              <button
                key={String(offer.id)}
                type="button"
                aria-label={`Show offer ${index + 1}`}
                aria-current={index === activeSlot ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeSlot ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {isFallback && (
          <div className="pointer-events-none absolute right-4 top-4 z-20 hidden rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 backdrop-blur sm:block">
            Fresh picks
          </div>
        )}
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
    'inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-extrabold text-[#0E4B47] shadow-sm transition hover:bg-[#E8F8F5] sm:min-h-12 sm:px-6 sm:text-base';

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
    <section className="order-2 mx-auto mt-7 w-full max-w-7xl px-4 sm:mt-9 sm:px-6 lg:px-8" aria-label="Loading offers">
      <Skeleton className="h-[178px] rounded-[24px] sm:h-[260px] lg:h-[340px]" />
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
