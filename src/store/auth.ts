import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MeResponse } from "@/services/auth";

interface AuthState {
  user: MeResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: MeResponse, token: string) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, accessToken: token, isAuthenticated: true });
      },

      setAccessToken: (token) => {
        set((state) => ({
          ...state,
          accessToken: token,
          // auténtico solo si hay user + token
          isAuthenticated: !!token && !!state.user,
        }));
      },

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), // 👈 forza localStorage en cliente
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
