'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDistance } from '@/utils/distance';
import type { Restaurant } from '@/types/restaurant';

interface NearbyRestaurantsProps {
  restaurants: Restaurant[];
  loading?: boolean;
}

export function NearbyRestaurants({ restaurants, loading }: NearbyRestaurantsProps) {
  if (loading) {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Restaurants near you</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card border border-gray-100 animate-pulse">
              <div className="h-36 bg-gray-200 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!restaurants.length) return null;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Restaurants near you</h2>
      <div className="grid gap-4">
        {restaurants.map((restaurant, idx) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Link href={`/restaurants/${restaurant.id}`}>
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="h-36 relative">
                  {restaurant.banner_url || restaurant.logo_url ? (
                    <img
                      src={restaurant.banner_url || restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full food-placeholder flex items-center justify-center">
                      <span className="text-white text-3xl font-bold opacity-60">
                        {restaurant.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {restaurant.is_open === false && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">
                        Currently Closed
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 leading-tight">{restaurant.name}</h3>
                    {restaurant.average_rating != null && restaurant.average_rating > 0 && (
                      <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        {restaurant.average_rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {restaurant.cuisine_types.join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {restaurant.estimated_delivery_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {restaurant.estimated_delivery_time}
                      </span>
                    )}
                    {restaurant.distance_km != null && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {formatDistance(restaurant.distance_km)}
                      </span>
                    )}
                    {restaurant.delivery_available && (
                      <Badge variant="success" className="text-[10px]">Free Delivery</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
