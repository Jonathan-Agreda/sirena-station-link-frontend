"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/services/auth";
import { useHydrated } from "@/hook/useHydrated";

type RoleGateProps = {
  allowed: Role[];
  children: React.ReactNode;
};

/**
 * Protege rutas según rol.
 * - Espera hidratación de Zustand para no redirigir antes de tiempo.
 * - Si no hay sesión -> login
 * - Si el rol no está permitido: solo bloquea /dashboard para RESIDENTE.
 */
export default function RoleGate({ allowed, children }: RoleGateProps) {
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user); // 👈 usa solo user (más confiable que isAuthenticated en race)
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const hasAllowed = allowed.includes(user.role);
    if (hasAllowed) {
      setChecked(true);
      return;
    }

    // Restricción mínima
    if (user.role === "RESIDENTE" && pathname.startsWith("/dashboard")) {
      router.replace("/sirenastation");
      return;
    }

    setChecked(true);
  }, [hydrated, user, allowed, router, pathname]);

  if (!hydrated || !checked) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm opacity-70">
        Validando acceso…
      </div>
    );
  }

  return <>{children}</>;
}
