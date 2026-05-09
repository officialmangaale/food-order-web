'use client';

import { useCallback, useSyncExternalStore } from 'react';

const CHECKOUT_INSTRUCTIONS_KEY = 'mangaale_checkout_instructions';
const INSTRUCTIONS_EVENT = 'mangaale:checkout-instructions';

export function useCheckoutInstructions() {
  const instructions = useSyncExternalStore(
    subscribeInstructions,
    readInstructions,
    getServerSnapshot
  );

  const setInstructions = useCallback((value: string) => {
    const limitedValue = value.slice(0, 300);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHECKOUT_INSTRUCTIONS_KEY, limitedValue);
    window.dispatchEvent(new Event(INSTRUCTIONS_EVENT));
  }, []);

  const clearInstructions = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(CHECKOUT_INSTRUCTIONS_KEY);
    window.dispatchEvent(new Event(INSTRUCTIONS_EVENT));
  }, []);

  return {
    instructions,
    setInstructions,
    clearInstructions,
  };
}

function subscribeInstructions(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(INSTRUCTIONS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(INSTRUCTIONS_EVENT, onStoreChange);
  };
}

function readInstructions() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(CHECKOUT_INSTRUCTIONS_KEY) ?? '';
}

function getServerSnapshot() {
  return '';
}
