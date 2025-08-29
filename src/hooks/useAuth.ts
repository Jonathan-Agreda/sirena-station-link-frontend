"use client";

import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const { accessToken, profile, isAuthenticated, clear } = useAuthStore();

  const roles = profile?.roles ?? [];

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (allowed: string[]) =>
    roles.some((r) => allowed.includes(r));

  return {
    token: accessToken,
    profile,
    isAuthenticated,
    clear,
    roles,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole("ADMIN"),
    isGuardia: hasRole("GUARDIA"),
    isSuperAdmin: hasRole("SUPERADMIN"),
    isResidente: hasRole("RESIDENTE"),
  };
}
