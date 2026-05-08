'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ManualLocationInput {
  area: string;
  city: string;
  pincode?: string;
  landmark?: string;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  permissionStatus: PermissionState | 'unknown';
  label: string | null;
  addressText: string | null;
  area: string | null;
  city: string | null;
  pincode: string | null;
  landmark: string | null;
  manualArea: string | null;

  setLocation: (lat: number, lng: number) => void;
  setCurrentLocation: (lat: number, lng: number, label?: string) => void;
  setPermissionStatus: (status: PermissionState | 'unknown') => void;
  setManualArea: (area: string) => void;
  setManualLocation: (location: ManualLocationInput) => void;
  clearLocation: () => void;

  requestBrowserLocation: () => Promise<{ lat: number; lng: number } | null>;
}

function buildAddressText({ area, city, pincode, landmark }: ManualLocationInput) {
  return [area, city, pincode, landmark].filter(Boolean).join(', ');
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      permissionStatus: 'unknown',
      label: null,
      addressText: null,
      area: null,
      city: null,
      pincode: null,
      landmark: null,
      manualArea: null,

      setLocation: (lat, lng) =>
        set({
          latitude: lat,
          longitude: lng,
          permissionStatus: 'granted',
          label: 'Current location',
        }),

      setCurrentLocation: (lat, lng, label = 'Current location') =>
        set({
          latitude: lat,
          longitude: lng,
          permissionStatus: 'granted',
          label,
          addressText: label,
        }),

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      setManualArea: (area) =>
        set({
          manualArea: area,
          label: area,
          area,
          addressText: area,
        }),

      setManualLocation: (location) => {
        const cleanArea = location.area.trim();
        const cleanCity = location.city.trim();
        const cleanPincode = location.pincode?.trim() || null;
        const cleanLandmark = location.landmark?.trim() || null;
        const label = [cleanArea, cleanCity].filter(Boolean).join(', ');

        set({
          latitude: null,
          longitude: null,
          label: label || cleanArea || cleanCity,
          addressText: buildAddressText({
            area: cleanArea,
            city: cleanCity,
            pincode: cleanPincode ?? undefined,
            landmark: cleanLandmark ?? undefined,
          }),
          area: cleanArea,
          city: cleanCity,
          pincode: cleanPincode,
          landmark: cleanLandmark,
          manualArea: cleanArea,
          permissionStatus: 'unknown',
        });
      },

      clearLocation: () =>
        set({
          latitude: null,
          longitude: null,
          label: null,
          addressText: null,
          area: null,
          city: null,
          pincode: null,
          landmark: null,
          manualArea: null,
        }),

      requestBrowserLocation: async () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          set({ permissionStatus: 'denied' });
          return null;
        }

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              set({
                latitude,
                longitude,
                permissionStatus: 'granted',
                label: 'Current location',
                addressText: 'Current location',
              });
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
        label: state.label,
        addressText: state.addressText,
        area: state.area,
        city: state.city,
        pincode: state.pincode,
        landmark: state.landmark,
        manualArea: state.manualArea,
      }),
    }
  )
);
