'use client';

import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import type { Offer } from '@/types/restaurant';

interface OfferSliderProps {
  offers: Offer[];
}

export function OfferSlider({ offers }: OfferSliderProps) {
  if (!offers.length) return null;

  return (
    <section className="mb-6">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
        {offers.map((offer, idx) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="flex-shrink-0 w-[280px] sm:w-[320px] rounded-2xl overflow-hidden"
          >
            {offer.image_url ? (
              <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${offer.image_url})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-sm font-bold leading-tight">{offer.title}</p>
                  {offer.description && <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{offer.description}</p>}
                </div>
              </div>
            ) : (
              <div className="h-32 food-placeholder flex items-center justify-center p-4">
                <div className="text-center text-white">
                  <Tag className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold leading-tight">{offer.title}</p>
                  {offer.description && <p className="text-xs opacity-80 mt-0.5">{offer.description}</p>}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
