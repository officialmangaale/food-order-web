'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  permissionStatus: PermissionState | 'unknown';
  manualArea: string | null;

  setLocation: (lat: number, lng: number) => void;
  setPermissionStatus: (status: PermissionState | 'unknown') => void;
  setManualArea: (area: string) => void;
  clearLocation: () => void;

  requestBrowserLocation: () => Promise<{ lat: number; lng: number } | null>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      latitude: null,
      longitude: null,
      permissionStatus: 'unknown',
      manualArea: null,

      setLocation: (lat, lng) => set({ latitude: lat, longitude: lng }),

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      setManualArea: (area) => set({ manualArea: area }),

      clearLocation: () =>
        set({ latitude: null, longitude: null, manualArea: null }),

      requestBrowserLocation: async () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          set({ permissionStatus: 'denied' });
          return null;
        }

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              set({ latitude, longitude, permissionStatus: 'granted' });
              resolve({ lat: latitude, lng: longitude });
            },
            () => {
              set({ permissionStatus: 'denied' });
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
          );
        });
      },
    }),
    {
      name: 'mangaale-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        permissionStatus: state.permissionStatus,
        manualArea: state.manualArea,
      }),
    }
  )
);
