import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MeResponse } from "@/services/auth"; // 👈 usamos el tipo enriquecido

interface AuthState {
  user: MeResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: MeResponse, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      // Guardamos directamente el usuario enriquecido (/residents/me normalizado)
      setAuth: (user, token) => {
        set({ user, accessToken: token, isAuthenticated: true });
      },

      // Permite actualizar solo el accessToken (cuando se refresca)
      setAccessToken: (token) => {
        set((state) => ({
          ...state,
          accessToken: token,
          isAuthenticated: !!token,
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
      name: "auth-storage", // nombre de la clave en localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
