import { create } from "zustand";

export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
};

type AuthState = {
  accessToken: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string | null, profile: UserProfile | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  profile: null,
  isAuthenticated: false,

  setAuth: (token, profile) =>
    set({
      accessToken: token,
      profile: profile
        ? { ...profile, roles: profile.roles ?? [] } // siempre roles array
        : null,
      isAuthenticated: !!token && !!profile,
    }),

  clear: () =>
    set({
      accessToken: null,
      profile: null,
      isAuthenticated: false,
    }),
}));
