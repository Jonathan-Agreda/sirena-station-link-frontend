"use client";

import { useEffect } from "react";
import { fetchMe, MeResponse, homeFor } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";

/**
 * Bootstrap global:
 * - Si hay accessToken y user === null, pide /residents/me
 *   y rellena el store (setAuth).
 * - Asegura que el usuario esté en una ruta válida según su rol.
 */
export default function AuthBootstrap() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        let currentUser = user;

        if (accessToken && !user) {
          const me: MeResponse = await fetchMe();
          const token = useAuthStore.getState().accessToken!;
          useAuthStore.getState().setAuth(me, token);
          currentUser = me;
        }

        if (currentUser) {
          const { role } = currentUser;

          // ✅ Rutas válidas por rol
          const canSeeSirenastation = true; // todos
          const canSeeDashboard = ["SUPERADMIN", "ADMIN", "GUARDIA"].includes(
            role
          );

          const isOnSirenastation = pathname.startsWith("/sirenastation");
          const isOnDashboard = pathname.startsWith("/dashboard");

          if (isOnSirenastation && canSeeSirenastation) return;
          if (isOnDashboard && canSeeDashboard) return;

          // 🚨 Fallback → si no está en una ruta válida
          const target = homeFor(role);
          if (pathname !== target) {
            router.replace(target);
          }
        }
      } catch {
        // Silencio: si falla, la UI pedirá login o reintentará
      }
    };

    bootstrap();
  }, [accessToken, user, router, pathname]);

  return null;
}
