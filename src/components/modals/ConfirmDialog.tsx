'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props { open: boolean; onClose: () => void; title?: string; children: ReactNode; }

export function ConfirmDialog({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF7F5] rounded-t-3xl p-6 max-w-lg mx-auto safe-bottom border border-[#F0DADA] shadow-2xl sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:w-[min(92vw,460px)]">
            <div className="flex items-center justify-between mb-4">
              {title && <h3 className="text-lg font-extrabold text-[#1F1A1A]">{title}</h3>}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white transition" aria-label="Close"><X className="w-5 h-5 text-[#4B3A3A]" /></button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
