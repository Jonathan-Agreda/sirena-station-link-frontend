"use client";

import { useAuthStore } from "@/store/auth";

/**
 * Hook para obtener roles y validaciones rápidas
 */
export function useRoles() {
  const profile = useAuthStore((s) => s.profile);

  const roles = profile?.roles ?? [];
  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (allowed: string[]) =>
    roles.some((r) => allowed.includes(r));

  return {
    roles,
    hasRole,
    hasAnyRole,
  };
}
