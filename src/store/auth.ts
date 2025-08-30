import { create } from "zustand";
import type { MeResponse } from "@/services/auth"; // 👈 usamos el tipo enriquecido

interface AuthState {
  user: MeResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: MeResponse, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  // Guardamos directamente el usuario enriquecido (/residents/me normalizado)
  setAuth: (user, token) => {
    set({ user, accessToken: token, isAuthenticated: true });
  },

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
}));
