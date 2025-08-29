"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

type Props = {
  allowed: string[]; // roles permitidos
  redirect?: string; // a dónde redirigir si no cumple
  children: ReactNode;
};

// Simple guard de cliente: redirige si no hay sesión o el rol no está permitido.
export default function RoleGate({
  allowed,
  redirect = "/login",
  children,
}: Props) {
  const { isAuthenticated, profile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const has = (profile?.roles || []).some((r) => allowed.includes(r));
    if (!has) {
      // Si no cumple rol, redirige según la "mejor" opción:
      if ((profile?.roles || []).includes("RESIDENTE"))
        router.replace("/resident");
      else router.replace("/dashboard");
    }
  }, [isAuthenticated, profile, allowed, router]);

  // Mientras decide, muestra el contenido para evitar parpadeos. En apps grandes pondríamos un spinner.
  return <>{children}</>;
}
