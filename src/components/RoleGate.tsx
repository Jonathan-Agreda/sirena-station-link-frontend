"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RoleGateProps = {
  allowed: string[];
  children: React.ReactNode;
};

/**
 * Protege rutas según rol.
 * Si no hay sesión -> redirige a /login
 * Si hay sesión pero rol no permitido -> redirige según rol permitido
 */
export default function RoleGate({ allowed, children }: RoleGateProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
    } else {
      const role = user.roles?.[0] || "RESIDENTE";
      if (!allowed.includes(role)) {
        // Redirigir al lugar correcto
        if (role === "RESIDENTE") {
          router.replace("/resident");
        } else {
          router.replace("/dashboard");
        }
      } else {
        setChecked(true);
      }
    }
  }, [isAuthenticated, user, allowed, router]);

  if (!checked) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm opacity-70">
        Validando acceso…
      </div>
    );
  }

  return <>{children}</>;
}
