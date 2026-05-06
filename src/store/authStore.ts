'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CustomerUser } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: CustomerUser | null;
  phone: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: CustomerUser) => void;
  setPhone: (phone: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      phone: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, phone: user.phone, isAuthenticated: true }),

      setPhone: (phone) => set({ phone }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'mangaale-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        phone: state.phone,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
