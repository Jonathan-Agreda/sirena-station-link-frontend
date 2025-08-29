"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";
import { jwtDecode } from "jwt-decode";
import { env } from "@/env";
import { useRouter } from "next/navigation";

type Props = { children: ReactNode };

type TokenPayload = {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
};

declare global {
  interface Window {
    __kc_inited?: boolean;
    __kc_refresh_interval?: number;
  }
}

export default function AuthProvider({ children }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();

  const qc = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si ya fue inicializado (por hot reload o doble render), solo sincronizamos estado y salimos
    if (window.__kc_inited) {
      if (keycloak.token) {
        const decoded = jwtDecode<TokenPayload>(keycloak.token);
        const roles = decoded?.realm_access?.roles || [];
        setAuth(keycloak.token, {
          id: decoded.sub,
          username: decoded.preferred_username,
          email: decoded.email,
          roles,
        });
      } else {
        clear();
      }
      return;
    }

    window.__kc_inited = true;

    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
        silentCheckSsoRedirectUri:
          typeof window !== "undefined"
            ? `${window.location.origin}/silent-check-sso.html`
            : undefined,
        redirectUri:
          typeof window !== "undefined" ? window.location.origin : undefined,
      })
      .then((authenticated) => {
        if (authenticated && keycloak.token) {
          const decoded = jwtDecode<TokenPayload>(keycloak.token);
          const roles = decoded?.realm_access?.roles || [];

          setAuth(keycloak.token, {
            id: decoded.sub,
            username: decoded.preferred_username,
            email: decoded.email,
            roles,
          });

          // Redirigimos a la landing de su rol solo si está en home o login
          const currentPath =
            typeof window !== "undefined" ? window.location.pathname : "/";
          if (currentPath === "/" || currentPath.startsWith("/login")) {
            if (roles.includes("RESIDENTE")) router.replace("/resident");
            else router.replace("/dashboard");
          }
        } else {
          clear();
        }
      })
      .catch(() => {
        clear();
      });

    // Refresh token (único intervalo global)
    if (window.__kc_refresh_interval) {
      clearInterval(window.__kc_refresh_interval);
    }
    window.__kc_refresh_interval = window.setInterval(() => {
      keycloak
        .updateToken(40)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            const decoded = jwtDecode<TokenPayload>(keycloak.token);
            const roles = decoded?.realm_access?.roles || [];
            setAuth(keycloak.token, {
              id: decoded.sub,
              username: decoded.preferred_username,
              email: decoded.email,
              roles,
            });
          }
        })
        .catch(() => {
          clear();
          router.replace("/login");
        });
    }, 20000);
  }, [router, setAuth, clear]);

  // Inyecta variables CSS de marca desde .env
  const cssVars = {
    ["--brand-primary" as any]: env.BRAND_PRIMARY,
    ["--brand-primary-fg" as any]: env.BRAND_PRIMARY_FG,
    ["--bg-light" as any]: env.BG_LIGHT,
    ["--fg-light" as any]: env.FG_LIGHT,
    ["--bg-dark" as any]: env.BG_DARK,
    ["--fg-dark" as any]: env.FG_DARK,
    ["--accent" as any]: env.ACCENT,
    ["--success" as any]: env.SUCCESS,
    ["--warning" as any]: env.WARNING,
    ["--danger" as any]: env.DANGER,
  } as React.CSSProperties;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div style={cssVars}>
        <QueryClientProvider client={qc}>
          {children}
          <Toaster richColors position="top-center" />
        </QueryClientProvider>
      </div>
    </ThemeProvider>
  );
}
