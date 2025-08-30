"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/services/auth";

type RoleGateProps = {
  allowed: Role[];
  children: React.ReactNode;
};

/**
 * Protege rutas según rol.
 * - Si no hay sesión -> login
 * - Si hay sesión y el rol no está en `allowed`, se restringe solo en casos específicos.
 */
export default function RoleGate({ allowed, children }: RoleGateProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const { role } = user;
    const hasAllowed = allowed.includes(role);

    if (hasAllowed) {
      setChecked(true);
      return;
    }

    // 🚨 Restricción mínima: residente no puede entrar a dashboard
    if (role === "RESIDENTE" && pathname.startsWith("/dashboard")) {
      router.replace("/sirenastation");
      return;
    }

    // Otros casos → permitimos continuar (ej: /home, /about, etc.)
    setChecked(true);
  }, [isAuthenticated, user, allowed, router, pathname]);

  if (!checked) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm opacity-70">
        Validando acceso…
      </div>
    );
  }

  return <>{children}</>;
}
