"use client";

import { useEffect } from "react";
import { fetchMe, MeResponse } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { useRouter, usePathname } from "next/navigation"; // 👈 Importa usePathname
import api from "@/lib/api";
import { useHydrated } from "@/hook/useHydrated";

// 👇 Define las rutas que no necesitan autenticación
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

/**
 * Bootstrap global:
 * - Si ya hay user + token hidratados → no tocar nada.
 * - Si hay token pero user vacío → pedir /residents/me.
 * - Si no hay token → intentar refresh (cookie HttpOnly).
 * - Si falla → /login.
 */
export default function AuthBootstrap() {
  const hydrated = useHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname(); // 👈 Obtiene la ruta actual

  useEffect(() => {
    const run = async () => {
      try {
        if (!hydrated) return;

        // 👇 CORRECCIÓN: Si la ruta es pública, no hagas nada.
        if (PUBLIC_ROUTES.includes(pathname)) {
          return;
        }

        // 1) token + user ya hidratados → confiar
        if (accessToken && user) return;

        // 2) token pero sin user → pedir perfil
        if (accessToken && !user) {
          try {
            const me: MeResponse = await fetchMe();
            useAuthStore.getState().setAuth(me, accessToken);
            return;
          } catch {
            // token inválido: limpiar para forzar refresh
            useAuthStore.getState().setAccessToken(null);
          }
        }

        // 3) sin token → intentar refresh
        if (!accessToken) {
          try {
            const res = await api.post("/auth/refresh/web");
            const token = res.data?.accessToken;
            if (!token) throw new Error("No accessToken en refresh");
            useAuthStore.getState().setAccessToken(token);
            const me: MeResponse = await fetchMe();
            useAuthStore.getState().setAuth(me, token);
            return;
          } catch {
            useAuthStore.getState().logout();
            router.replace("/login");
            return;
          }
        }
      } catch {
        useAuthStore.getState().logout();
        router.replace("/login");
      }
    };

    run();
  }, [hydrated, accessToken, user, router, pathname]); // 👈 Añade pathname a las dependencias

  return null;
}
