'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 z-[100] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 md:bottom-6"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              role="status"
              className={`flex items-center gap-3 rounded-control border px-4 py-3 shadow-elevated ${
                t.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : t.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'border-line bg-surface text-ink'
              }`}
            >
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
              {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />}
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-subtle transition hover:bg-black/5 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
