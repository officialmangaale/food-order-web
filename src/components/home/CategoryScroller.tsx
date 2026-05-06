'use client';

import { motion } from 'framer-motion';
import type { HomeFeedCategory } from '@/types/restaurant';

interface CategoryScrollerProps {
  categories: HomeFeedCategory[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function CategoryScroller({ categories, selectedId, onSelect }: CategoryScrollerProps) {
  if (!categories.length) return null;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3">What are you craving?</h2>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
        {categories.map((cat, idx) => {
          const isActive = selectedId === cat.id;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(cat.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors min-w-[80px] ${
                isActive
                  ? 'bg-cherry-50 border-2 border-cherry-500'
                  : 'bg-white border-2 border-transparent shadow-card hover:border-gray-200'
              }`}
            >
              {cat.image_url ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden">
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl food-placeholder flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{cat.name.charAt(0)}</span>
                </div>
              )}
              <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'text-cherry-700' : 'text-gray-700'}`}>
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
