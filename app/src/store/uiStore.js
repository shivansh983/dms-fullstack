import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUiStore = create(
  persist(
    (set) => ({
      mode: 'light',
      toggleTheme: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),

      isOffline: false,
      setOffline: (isOffline) => set({ isOffline }),
    }),
    {
      name: 'dms.ui',
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (s) => ({ mode: s.mode }),
    }
  )
);