import { create } from "zustand";

type User = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({ user, accessToken: token, isAuthenticated: true }),

  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
