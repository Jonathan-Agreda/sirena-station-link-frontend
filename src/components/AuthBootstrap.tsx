"use client";

import { useEffect } from "react";
import { fetchMe, MeResponse } from "@/services/auth";
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
            useAuthStore.getState().logout();
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

        // 🔹 Validar solo la restricción crítica
        if (currentUser) {
          const { role } = currentUser;
          if (role === "RESIDENTE" && pathname.startsWith("/dashboard")) {
            router.replace("/sirenastation");
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
