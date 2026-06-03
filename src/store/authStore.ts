'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clearPersistedActiveOrderState, useActiveOrderStore } from '@/store/activeOrderStore';
import type { CustomerUser } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: CustomerUser | null;
  phone: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, userOrPhone: CustomerUser | string) => void;
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

      setAuth: (token, userOrPhone) => {
        const user = typeof userOrPhone === 'string' ? { phone: userOrPhone } : userOrPhone;
        set({ token, user, phone: user.phone, isAuthenticated: true });
      },

      setPhone: (phone) => set({ phone }),

      logout: () => {
        useActiveOrderStore.getState().clearActiveOrder();
        clearPersistedActiveOrderState();
        debugLogoutCleanup();
        set({ token: null, user: null, phone: null, isAuthenticated: false });
      },
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

function debugLogoutCleanup() {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[auth] logout-cleared-tracking-state');
  }
}
