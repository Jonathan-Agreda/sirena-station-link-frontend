"use client";

import { useEffect } from "react";
import { fetchMe, MeResponse, homeFor } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

/**
 * Bootstrap global:
 * - Si hay accessToken y user === null → pide /residents/me y rellena el store.
 * - Si no hay accessToken → intenta refrescarlo vía cookie (/auth/refresh/web).
 * - Si falla → redirige a /login.
 */
export default function AuthBootstrap() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        let currentUser = user;
        let token = accessToken;

        // 🔹 Si no hay accessToken → intentar refresh
        if (!token) {
          try {
            const res = await api.post("/auth/refresh/web");
            token = res.data?.accessToken;
            if (token) {
              useAuthStore.getState().setAccessToken(token);
            } else {
              router.replace("/login");
              return;
            }
          } catch {
            useAuthStore.getState().logout(); // limpiar store también
            router.replace("/login");
            return;
          }
        }

        // 🔹 Si hay token pero no hay user → pedir perfil
        if (token && !currentUser) {
          try {
            const me: MeResponse = await fetchMe();
            useAuthStore.getState().setAuth(me, token);
            currentUser = me;
          } catch {
            useAuthStore.getState().logout();
            router.replace("/login");
            return;
          }
        }

        // 🔹 Validar rutas según rol
        if (currentUser) {
          const { role } = currentUser;

          const canSeeSirenastation = true; // todos los roles
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
        useAuthStore.getState().logout();
        router.replace("/login");
      }
    };

    bootstrap();
  }, [accessToken, user, router, pathname]);

  return null;
}
