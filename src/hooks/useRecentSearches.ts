'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mangaale_recent_searches';
const RECENT_SEARCHES_EVENT = 'mangaale:recent-searches';
const MAX_RECENT_SEARCHES = 5;
const EMPTY_SEARCHES: string[] = [];

let cachedRawValue: string | null | undefined;
let cachedSearches: string[] = EMPTY_SEARCHES;

export function useRecentSearches() {
  const searches = useSyncExternalStore(subscribe, readRecentSearches, getServerSnapshot);

  const addSearch = useCallback((term: string) => {
    const normalized = term.trim();
    if (!normalized || typeof window === 'undefined') return;

    const next = [
      normalized,
      ...readRecentSearches().filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    const serialized = JSON.stringify(next);
    cachedRawValue = serialized;
    cachedSearches = next;

    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
  }, []);

  const clearSearches = useCallback(() => {
    if (typeof window === 'undefined') return;
    cachedRawValue = null;
    cachedSearches = EMPTY_SEARCHES;
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
  }, []);

  return { searches, addSearch, clearSearches };
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const notify = () => callback();
  window.addEventListener('storage', notify);
  window.addEventListener(RECENT_SEARCHES_EVENT, notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(RECENT_SEARCHES_EVENT, notify);
  };
}

function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return EMPTY_SEARCHES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawValue) return cachedSearches;

    cachedRawValue = raw;
    if (!raw) {
      cachedSearches = EMPTY_SEARCHES;
      return cachedSearches;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedSearches = EMPTY_SEARCHES;
      return cachedSearches;
    }

    cachedSearches = parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_RECENT_SEARCHES);

    return cachedSearches;
  } catch {
    cachedRawValue = undefined;
    cachedSearches = EMPTY_SEARCHES;
    return cachedSearches;
  }
}

function getServerSnapshot() {
  return EMPTY_SEARCHES;
}
